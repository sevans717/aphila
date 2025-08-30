#!/bin/sh
# chown-data.sh - ensure mounted postgres data directory is owned by provided UID:GID
set -e
UID=${LOCAL_UID:-1000}
GID=${LOCAL_GID:-1000}
TARGET=/var/lib/postgresql/data
if [ -d "$TARGET" ]; then
  echo "Ensuring ownership of $TARGET is ${UID}:${GID}"
  chown -R ${UID}:${GID} "$TARGET" || true
fi
exit 0
