require("dotenv").config();
const { Pool } = require("pg");
const { createClient } = require("redis");
const { generateForUser } = require("./lib/recommendations");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis Client Error", err));

async function getActiveUsers(limit = 100) {
  const res = await pool.query(
    "SELECT id FROM users ORDER BY last_active_at DESC NULLS LAST LIMIT $1",
    [limit]
  );
  return res.rows.map((r) => r.id);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let running = true;
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down worker");
  running = false;
});
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down worker");
  running = false;
});

async function runOnce() {
  try {
    const users = await getActiveUsers(500);
    console.log(`Found ${users.length} users to process`);
    for (const uid of users) {
      if (!running) break;
      try {
        const candidates = await generateForUser(uid, 20);
        console.log(`Generated ${candidates.length} recs for user ${uid}`);
        // small pause to avoid DB thundering
        await sleep(150);
      } catch (err) {
        console.error(`Failed to generate for ${uid}:`, err.message || err);
      }
    }
  } catch (err) {
    console.error("Worker iteration failed:", err);
  }
}

async function mainLoop() {
  const intervalSeconds = parseInt(
    process.env.RECS_INTERVAL_SECONDS || process.env.RECS_INTERVAL || "3600",
    10
  );
  console.log(`Recommendation worker starting; interval ${intervalSeconds}s`);

  while (running) {
    const start = Date.now();
    await runOnce();
    if (!running) break;
    const elapsed = (Date.now() - start) / 1000;
    const sleepFor = Math.max(5, intervalSeconds - elapsed);
    console.log(`Iteration complete, sleeping ${Math.round(sleepFor)}s`);
    await sleep(sleepFor * 1000);
  }

  try {
    await redisClient.quit();
  } catch (_e) {
    console.warn("Failed to quit redis client", _e);
  }
  try {
    await pool.end();
  } catch (_e) {
    console.warn("Failed to close pg pool", _e);
  }
  console.log("Recommendation worker stopped");
  process.exit(0);
}

mainLoop().catch((err) => {
  console.error("Worker fatal error:", err);
  process.exit(1);
});
