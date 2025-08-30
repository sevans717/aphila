import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";

export default async function globalSetup() {
  // Load test environment variables
  config({ path: path.resolve(__dirname, "../.env.test") });

  // Ensure .env.test is loaded by setting ENV
  process.env.NODE_ENV = "test";
  const testDbUrl = "postgresql://test:test@localhost:10001/sav3_test";
  process.env.DATABASE_URL = testDbUrl;

  const root = path.resolve(__dirname, "..");
  try {
    console.log("Running Prisma migrate deploy for test DB...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, DATABASE_URL: testDbUrl },
    });
    console.log("Seeding test DB...");
    execSync("npm run prisma:seed", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, DATABASE_URL: testDbUrl },
    });
  } catch (err) {
    console.error("Failed to prepare test DB", err);
    throw err;
  }
}
