#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);
}

async function appliedMigrations() {
  const res = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(res.rows.map(r => r.filename));
}

async function applyMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;
  console.log('Applying', path.basename(filePath));
  await pool.query(sql);
  await pool.query('INSERT INTO schema_migrations(filename) VALUES($1) ON CONFLICT DO NOTHING', [path.basename(filePath)]);
}

async function main() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, creating one at', migrationsDir);
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  await ensureMigrationsTable();
  const applied = await appliedMigrations();
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const f of files) {
    if (applied.has(f)) {
      console.log('Skipping already applied', f);
      continue;
    }
    const p = path.join(migrationsDir, f);
    try {
      await applyMigration(p);
    } catch (err) {
      console.error('Failed to apply', f, err.message || err);
      process.exit(1);
    }
  }

  console.log('Migrations complete');
  await pool.end();
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
