#!/usr/bin/env bash
# Run EXPLAIN ANALYZE for a given query and save output

set -euo pipefail

DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/postgres"}
QUERY_FILE=${1:-}
OUT=${2:-"tmp/explain_plan.txt"}

if [ -z "$QUERY_FILE" ]; then
  echo "Usage: $0 <query.sql> [out_file]"
  exit 2
fi

QUERY=$(cat "$QUERY_FILE")

echo "Running EXPLAIN ANALYZE and saving to $OUT"

psql "$DB_URL" -Atc "EXPLAIN (ANALYZE, BUFFERS, VERBOSE) $QUERY" > "$OUT"

echo "Saved explain plan to $OUT"
