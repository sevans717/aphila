#!/bin/sh
set -e
# Simple entrypoint that forwards args to pgbackrest, failing gracefully if binary missing
if command -v pgbackrest >/dev/null 2>&1; then
  exec pgbackrest "$@"
else
  echo "pgbackrest binary not found in image. Exiting." >&2
  exit 1
fi
