#!/usr/bin/env bash
# Collect top slow queries using pg_stat_statements

set -euo pipefail

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/postgres"}
OUT=${1:-"tmp/slow_queries.txt"}

echo "Collecting top slow queries to $OUT"

psql "$DB_URL" -Atc "SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 50;" > "$OUT"

echo "Saved slow queries to $OUT"
