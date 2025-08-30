# pgBackRest Backup & PITR System

This document describes the comprehensive backup and Point-in-Time Recovery (PITR) system for the SAV3 PostgreSQL database using pgBackRest.

## Architecture Overview

The backup system consists of:

- **Primary PostgreSQL**: Main database with WAL archiving enabled
- **pgBackRest Container**: Backup repository and management
- **Backup Scheduler**: Automated backup scheduling and health monitoring
- **Health Monitoring**: HTTP endpoint for backup system status

## Files and Configuration

### Docker Compose

- `docker-compose.backups.yml` - Complete backup infrastructure
- `docker/postgres/backup-init/01-setup-pgbackrest.sh` - Database initialization for backups
- `docker/pgbackrest/pgbackrest.conf` - pgBackRest configuration

### Backup Scheduler

- `docker/backup-scheduler/` - Custom backup scheduler container
- `docker/backup-scheduler/scripts/run-backup.sh` - Main backup execution script
- `docker/backup-scheduler/scripts/backup-health-server.sh` - Health monitoring endpoint
- `docker/backup-scheduler/scripts/backup-maintenance.sh` - Cleanup and maintenance

### Operational Scripts

- `scripts/backup-health/restore-backup.sh` - Manual restore script
- `scripts/backup-health/check-backup-health.sh` - Comprehensive health check

## Quick Start

### 1. Start Backup Infrastructure

```bash
docker compose -f docker-compose.backups.yml up --build -d
```

### 2. Verify Backup System

```bash
# Check backup health
./scripts/backup-health/check-backup-health.sh

# Check backup scheduler endpoint
curl http://localhost:8080
```

### 3. Manual Backup Operations

```bash
# Force a full backup
docker compose -f docker-compose.backups.yml exec backup-scheduler /usr/local/bin/run-backup.sh full

# Force a differential backup
docker compose -f docker-compose.backups.yml exec backup-scheduler /usr/local/bin/run-backup.sh diff
```

## Backup Schedule

- **Full Backup**: Weekly on Sunday at 2 AM
- **Differential Backup**: Daily (Monday-Saturday) at 2 AM
- **Incremental Backup**: Every 6 hours
- **Maintenance**: Hourly cleanup and health checks

## Retention Policy

- **Full Backups**: 7 retained
- **Differential Backups**: 4 retained
- **Log Files**: 30 days retention
- **WAL Archives**: Managed automatically by pgBackRest

## Disaster Recovery

### Test Restore (Recommended for DR Drills)

```bash
# Restore latest backup to test location
./scripts/backup-health/restore-backup.sh

# Restore specific backup
./scripts/backup-health/restore-backup.sh 20241226-123456F

# Verify restored data
ls -la /tmp/postgres-restore-test
```

### Production Restore (Emergency Only)

```bash
# Stop PostgreSQL service
docker compose down

# Restore to production location (DANGEROUS!)
./scripts/backup-health/restore-backup.sh latest /var/lib/postgresql/data false

# Restart service
docker compose up -d
```

### Point-in-Time Recovery (PITR)

```bash
# Restore to specific timestamp
pgbackrest --stanza=main --pg1-path=/var/lib/postgresql/data \
  --type=time --target="2024-12-26 14:30:00" restore
```

## Monitoring and Health Checks

### Health Endpoint

The backup scheduler exposes a health endpoint at `http://localhost:8080`:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-26T15:30:00Z",
  "last_backup_age_hours": "6",
  "messages": []
}
```

### Manual Health Check

```bash
./scripts/backup-health/check-backup-health.sh
```

### Log Monitoring

```bash
# View backup logs
docker compose -f docker-compose.backups.yml exec backup-scheduler tail -f /var/log/backups/maintenance.log

# View specific backup log
docker compose -f docker-compose.backups.yml exec backup-scheduler ls /var/log/backups/
```

## Security Considerations

### Database Access

- Dedicated `pgbackrest` user with minimal permissions
- Replication privileges for WAL streaming
- Password authentication (update for production)

### Network Security

- Backup traffic isolated to Docker network
- Health endpoint exposed only locally
- Consider TLS for production deployments

### Backup Security

- Repository stored in Docker volumes
- Consider encryption at rest for sensitive data
- Implement offsite backup strategy for production

## Production Hardening

### For Production Deployment

1. **Update Passwords**: Change default passwords in environment variables
2. **Enable TLS**: Configure SSL/TLS for database connections
3. **Offsite Backups**: Implement backup replication to remote storage
4. **Monitoring Integration**: Connect health endpoint to monitoring system
5. **Access Control**: Restrict network access and implement proper authentication

### Environment Variables

```bash
# Required for production
POSTGRES_PASSWORD=secure_password_here
PGBACKREST_STANZA=main
BACKUP_SCHEDULE_FULL="0 2 * * 0"      # Weekly full
BACKUP_SCHEDULE_DIFF="0 2 * * 1-6"    # Daily diff
BACKUP_SCHEDULE_INCR="0 */6 * * *"    # 6-hourly incremental
RETENTION_DAYS=30
```

## Troubleshooting

### Common Issues

1. **Backup Fails with Permission Error**
   - Check pgbackrest user permissions
   - Verify pg_hba.conf configuration

2. **WAL Archive Failures**
   - Check archive_command configuration
   - Verify pgbackrest stanza setup

3. **Repository Space Issues**
   - Monitor repository usage via health endpoint
   - Adjust retention policy if needed

### Debug Commands

```bash
# Check pgbackrest configuration
pgbackrest --stanza=main check

# View backup information
pgbackrest --stanza=main info

# Test archive command
pgbackrest --stanza=main archive-push /path/to/wal/file

# Verify specific backup
pgbackrest --stanza=main --set=20241226-123456F verify
```

## Integration with Existing System

This backup system integrates with:

- Existing Docker Compose setup
- Prisma database migrations
- Current PostgreSQL configuration
- PgBouncer connection pooling (when implemented)

The system is designed to work alongside the existing `docker-compose.yml` without conflicts.
