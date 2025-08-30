# Container ↔ Host UID/GID and Timezone Matching

This document explains how the Docker compose stacks in this repo are configured so container processes run with the same UID/GID and timezone as your host user. This helps avoid permission problems when bind-mounting volumes, and keeps file ownership consistent for backup repositories and DB data.

Environment variables (recommended in your `.env`):

- `LOCAL_UID` — numeric UID to run containers as (default: `1000`).
- `LOCAL_GID` — numeric GID to run containers as (default: `1000`).
- `TZ` — timezone for containers (default: `UTC`).
- `POSTGRES_PASSWORD` — database password used across DB and pgBackRest stacks.

How it works:

- Compose files set `user: "${LOCAL_UID:-1000}:${LOCAL_GID:-1000}"` for services where it's safe.
- Init scripts are mounted into containers and run at start to `chown` mounted volume directories (`chown-data.sh`, `chown-repo.sh`, `chown-logs.sh`). They are idempotent and safe to run multiple times.

Windows notes:

- Windows does not use Unix UIDs/GIDs; the `user:` field is ignored on Windows containers. Use WSL2 for a Linux-like experience or ensure file permissions are acceptable.
- Git on Windows may not preserve executable permission bits for shell scripts. If using WSL2 or Linux, run:

```pwsh
# from repo root in PowerShell (WSL2) or Linux
chmod +x docker/postgres/init-scripts/chown-data.sh
chmod +x docker/pgbackrest/init-scripts/chown-repo.sh
chmod +x docker/backup-scheduler/init-scripts/chown-logs.sh
```

Usage example:

1. Create or update `.env` with:

```env
LOCAL_UID=1000
LOCAL_GID=1000
TZ=America/Los_Angeles
POSTGRES_PASSWORD=your_secret_here
```

2. Validate compose file:

```pwsh
docker-compose -f docker-compose.backups.yml config
```

3. Start the backups stack:

```pwsh
docker-compose -f docker-compose.backups.yml up -d --build
```

4. Verify ownership inside containers (example):

```pwsh
docker exec -it <container-name> ls -la /var/lib/postgresql/data
```

If you want the container to run as a specific host user (recommended on Linux/macOS), set `LOCAL_UID` and `LOCAL_GID` to match `id -u` and `id -g` from your host.

Security note:

Running containers as a non-root UID reduces some risks but not all. Ensure the UID/GID you pass has appropriate access to mounted directories, and never run production DB containers as an untrusted UID that may interfere with system files.
