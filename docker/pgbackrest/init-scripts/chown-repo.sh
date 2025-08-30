#!/bin/sh
# chown-repo.sh - ensure pgbackrest repo directory is owned by provided UID:GID
set -e
UID=${LOCAL_UID:-1000}
GID=${LOCAL_GID:-1000}
TARGET=/var/lib/pgbackrest
if [ -d "$TARGET" ]; then
  echo "Ensuring ownership of $TARGET is ${UID}:${GID}"
  chown -R ${UID}:${GID} "$TARGET" || true
fi
exit 0
