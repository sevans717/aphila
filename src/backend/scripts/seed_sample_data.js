require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const crypto = require('crypto');

async function randomPoint() {
  const lat = 37.7 + (Math.random() - 0.5) * 0.2; // around SF
  const lon = -122.4 + (Math.random() - 0.5) * 0.2;
  return `SRID=4326;POINT(${lon} ${lat})`;
}

async function seed(n = 50) {
  try {
    for (let i = 0; i < n; i++) {
      const username = `u${Date.now().toString(36)}${i}`;
      const email = `${username}@example.test`;
      const password_hash = crypto.randomBytes(16).toString('hex');
      const display_name = `User ${i}`;
      const gender = i % 2 === 0 ? 'female' : 'male';
      const point = await randomPoint();
      await pool.query(
        `INSERT INTO users (username, email, password_hash, display_name, gender, location, created_at) VALUES ($1,$2,$3,$4,$5, ST_GeomFromText($6,4326), now())`,
        [username, email, password_hash, display_name, gender, point]
      );
    }
    console.log('Seed complete');
  } catch (err) {
    console.error('Seed failed', err);
  } finally {
    await pool.end();
  }
}

seed(process.argv[2] ? parseInt(process.argv[2],10) : 50);
