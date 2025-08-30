# Disaster Recovery Runbooks

This document provides comprehensive disaster recovery procedures for the SAV3 backend system, covering database, media storage, and application components.

## Overview

The SAV3 system consists of multiple components that require coordinated disaster recovery procedures:

- **PostgreSQL Database** (Primary/Replica with pgBackRest)
- **Media Storage** (MinIO/S3 with Redis cache)
- **Application Services** (API, WebSocket, Background Jobs)
- **Monitoring Stack** (Prometheus, Grafana, AlertManager)
- **Infrastructure** (Docker Compose, Traefik, PgBouncer)

## Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Component     | RTO Target   | RPO Target  | Priority |
| ------------- | ------------ | ----------- | -------- |
| Database      | < 15 minutes | < 5 minutes | Critical |
| Media Storage | < 30 minutes | < 1 hour    | High     |
| API Services  | < 10 minutes | < 1 minute  | Critical |
| Monitoring    | < 1 hour     | < 1 hour    | Medium   |

## Disaster Scenarios

### 1. Complete Infrastructure Failure

**Scenario**: Complete hardware failure or data center outage.

**Recovery Procedure**:

1. **Assessment Phase** (0-5 minutes)

   ```bash
   # Check system status
   ./scripts/dr/assess-disaster.sh

   # Verify backup integrity
   ./scripts/dr/verify-backups.sh
   ```

2. **Infrastructure Setup** (5-15 minutes)

   ```bash
   # Deploy to new infrastructure
   ./scripts/dr/deploy-infrastructure.sh --target production-backup

   # Verify network connectivity
   ./scripts/dr/verify-connectivity.sh
   ```

3. **Database Recovery** (15-25 minutes)

   ```bash
   # Restore database from latest backup
   ./scripts/dr/restore-database.sh --from-backup latest

   # Verify database integrity
   ./scripts/dr/verify-database.sh
   ```

4. **Media Storage Recovery** (25-35 minutes)

   ```bash
   # Restore media storage
   ./scripts/dr/restore-media.sh --from-backup latest

   # Verify media access
   ./scripts/dr/verify-media.sh
   ```

5. **Application Deployment** (35-45 minutes)

   ```bash
   # Deploy application services
   ./scripts/dr/deploy-services.sh --env production

   # Run smoke tests
   ./scripts/dr/smoke-tests.sh
   ```

### 2. Database Corruption/Failure

**Scenario**: PostgreSQL database corruption or complete database failure.

**Recovery Procedure**:

1. **Immediate Response** (0-2 minutes)

   ```bash
   # Enable read-only mode
   ./scripts/dr/enable-readonly-mode.sh

   # Assess database damage
   ./scripts/dr/assess-database-damage.sh
   ```

2. **Failover to Replica** (2-5 minutes)

   ```bash
   # Promote replica to primary
   ./scripts/dr/promote-replica.sh

   # Update application configuration
   ./scripts/dr/switch-database-connection.sh --to replica
   ```

3. **Rebuild Primary** (Background - 30-60 minutes)

   ```bash
   # Rebuild primary from backup
   ./scripts/dr/rebuild-primary.sh --from-backup latest

   # Re-establish replication
   ./scripts/dr/setup-replication.sh
   ```

### 3. Media Storage Failure

**Scenario**: MinIO/S3 storage failure or corruption.

**Recovery Procedure**:

1. **Switch to Backup Storage** (0-5 minutes)

   ```bash
   # Switch to S3 backup
   ./scripts/dr/switch-media-backend.sh --to s3-backup

   # Verify media access
   ./scripts/dr/verify-media-access.sh
   ```

2. **Restore Media Data** (5-30 minutes)

   ```bash
   # Restore from backup
   ./scripts/dr/restore-media-storage.sh --from-backup latest

   # Sync missing files
   ./scripts/dr/sync-media-files.sh
   ```

### 4. Application Service Failure

**Scenario**: API service failure or container issues.

**Recovery Procedure**:

1. **Service Restart** (0-2 minutes)

   ```bash
   # Restart services
   docker-compose restart api websocket worker

   # Check service health
   ./scripts/health/check-services.sh
   ```

2. **Rollback Deployment** (2-10 minutes)

   ```bash
   # Rollback to previous version
   ./scripts/dr/rollback-deployment.sh --to previous

   # Verify rollback success
   ./scripts/dr/verify-rollback.sh
   ```

## DR Scripts and Tools

### Assessment Scripts

```bash
#!/bin/bash
# scripts/dr/assess-disaster.sh
# Comprehensive disaster assessment

echo "=== Disaster Assessment ==="
echo "Timestamp: $(date)"

# Check infrastructure components
./scripts/health/check-infrastructure.sh
./scripts/health/check-database.sh
./scripts/health/check-media.sh
./scripts/health/check-services.sh

# Generate assessment report
./scripts/dr/generate-assessment-report.sh
```

### Database Recovery Scripts

```bash
#!/bin/bash
# scripts/dr/restore-database.sh
# Database restoration from pgBackRest backup

BACKUP_ID=${1:-latest}

echo "Restoring database from backup: $BACKUP_ID"

# Stop database services
docker-compose stop postgres pgbouncer

# Restore from backup
docker exec postgres-backup pgbackrest restore \
  --stanza=main \
  --delta \
  --backup-id="$BACKUP_ID"

# Start services
docker-compose start postgres pgbouncer

# Verify restoration
./scripts/dr/verify-database-restore.sh
```

### Media Recovery Scripts

```bash
#!/bin/bash
# scripts/dr/restore-media.sh
# Media storage restoration

BACKUP_LOCATION=${1:-latest}

echo "Restoring media storage from: $BACKUP_LOCATION"

# Stop media services
docker-compose -f docker-compose.media.yml stop

# Restore MinIO data
./scripts/backup/restore-minio-data.sh "$BACKUP_LOCATION"

# Restore Redis cache
./scripts/backup/restore-redis-data.sh "$BACKUP_LOCATION"

# Start services
docker-compose -f docker-compose.media.yml start

# Verify restoration
./scripts/dr/verify-media-restore.sh
```

## Backup Validation Procedures

### Daily Backup Validation

```bash
#!/bin/bash
# scripts/dr/validate-daily-backups.sh
# Automated daily backup validation

echo "=== Daily Backup Validation ==="

# Validate database backups
./scripts/backup/validate-db-backup.sh --latest

# Validate media backups
./scripts/backup/validate-media-backup.sh --latest

# Test restore procedures (non-destructive)
./scripts/dr/test-restore-procedures.sh --dry-run

# Generate validation report
./scripts/dr/generate-validation-report.sh
```

### Weekly DR Testing

```bash
#!/bin/bash
# scripts/dr/weekly-dr-test.sh
# Comprehensive weekly DR testing

echo "=== Weekly DR Test ==="

# Create isolated test environment
./scripts/dr/create-test-environment.sh

# Simulate disaster scenarios
./scripts/dr/simulate-database-failure.sh --env test
./scripts/dr/simulate-media-failure.sh --env test
./scripts/dr/simulate-service-failure.sh --env test

# Measure recovery times
./scripts/dr/measure-recovery-times.sh

# Cleanup test environment
./scripts/dr/cleanup-test-environment.sh

# Generate DR test report
./scripts/dr/generate-dr-test-report.sh
```

## Incident Response Procedures

### Incident Classification

| Severity      | Description                  | Response Time | Examples                            |
| ------------- | ---------------------------- | ------------- | ----------------------------------- |
| P0 - Critical | Complete system unavailable  | < 15 minutes  | Database down, API unreachable      |
| P1 - High     | Major functionality impaired | < 1 hour      | Slow queries, media uploads failing |
| P2 - Medium   | Minor functionality impaired | < 4 hours     | Non-critical features down          |
| P3 - Low      | Cosmetic or future impact    | < 24 hours    | Monitoring alerts, log warnings     |

### Incident Response Process

1. **Detection & Alert**
   - Automated monitoring triggers alert
   - On-call engineer receives notification
   - Incident response team assembled

2. **Assessment & Classification**

   ```bash
   # Run incident assessment
   ./scripts/dr/assess-incident.sh --severity auto

   # Generate initial status report
   ./scripts/dr/create-incident-report.sh
   ```

3. **Response & Mitigation**

   ```bash
   # Execute appropriate DR procedure
   ./scripts/dr/execute-response.sh --incident-id $INCIDENT_ID

   # Monitor recovery progress
   ./scripts/dr/monitor-recovery.sh --incident-id $INCIDENT_ID
   ```

4. **Communication**
   - Update status page
   - Notify stakeholders
   - Document progress

5. **Resolution & Post-Mortem**
   - Verify full service restoration
   - Conduct post-incident review
   - Update procedures based on learnings

### Communication Templates

#### Initial Incident Notification

```text
Subject: [P0] SAV3 System Incident - Database Unavailable

We are currently investigating reports of database connectivity issues affecting the SAV3 platform.

Impact: Users may experience login failures and data access issues
Start Time: [TIMESTAMP]
ETA: Investigating (updates every 15 minutes)

Response Team: [TEAM_MEMBERS]
Incident ID: [INCIDENT_ID]

Next update: [TIMESTAMP + 15 min]
```

#### Resolution Notification

```text
Subject: [RESOLVED] SAV3 System Incident - Database Restored

The database connectivity issue affecting the SAV3 platform has been resolved.

Resolution: Primary database restored from backup
Total Downtime: [DURATION]
Root Cause: [BRIEF_DESCRIPTION]

All services are now fully operational. A detailed post-mortem will be published within 48 hours.

Incident ID: [INCIDENT_ID]
```

## Monitoring and Alerting

### Critical Alerts

```yaml
# Alert rules for DR scenarios
groups:
  - name: disaster_recovery
    rules:
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          runbook: "https://docs.sav3.app/dr/database-failure"

      - alert: MediaStorageDown
        expr: up{job="minio"} == 0
        for: 2m
        labels:
          severity: high
        annotations:
          summary: "Media storage is unreachable"
          runbook: "https://docs.sav3.app/dr/media-failure"

      - alert: APIServiceDown
        expr: up{job="api"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "API service is down"
          runbook: "https://docs.sav3.app/dr/service-failure"
```

### Health Check Endpoints

```typescript
// Health endpoints for DR monitoring
app.get("/health/database", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/health/media", async (req, res) => {
  try {
    // Check media storage connectivity
    const result = await MediaService.healthCheck();
    res.json({ status: "healthy", ...result });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

## Recovery Verification

### Database Verification

```bash
#!/bin/bash
# scripts/dr/verify-database-restore.sh

echo "Verifying database restoration..."

# Check database connectivity
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Database connection failed"
    exit 1
fi

# Verify data integrity
./scripts/db/verify-data-integrity.sh

# Check replication status
./scripts/db/check-replication-status.sh

# Verify application connectivity
./scripts/dr/test-app-db-connection.sh

echo "✅ Database verification complete"
```

### Media Storage Verification

```bash
#!/bin/bash
# scripts/dr/verify-media-restore.sh

echo "Verifying media storage restoration..."

# Test MinIO connectivity
if ! mc ping minio-local > /dev/null 2>&1; then
    echo "❌ MinIO connection failed"
    exit 1
fi

# Verify bucket access
./scripts/media/verify-bucket-access.sh

# Test file upload/download
./scripts/media/test-file-operations.sh

# Verify Redis cache
./scripts/media/verify-redis-cache.sh

echo "✅ Media storage verification complete"
```

## Documentation and Training

### DR Team Roles

| Role                    | Primary Responsibilities                  | Backup           |
| ----------------------- | ----------------------------------------- | ---------------- |
| Incident Commander      | Overall coordination, communication       | DevOps Lead      |
| Database Administrator  | Database recovery, replication            | Senior Developer |
| Infrastructure Engineer | Hardware, networking, containers          | DevOps Engineer  |
| Communications Lead     | Status updates, stakeholder communication | Product Manager  |

### Training Schedule

- **Monthly**: DR procedure review and updates
- **Quarterly**: Full DR simulation exercise
- **Annually**: Cross-team training and certification

### Documentation Maintenance

- Update procedures after each incident
- Quarterly review of RTO/RPO targets
- Annual review of disaster scenarios
- Continuous improvement based on lessons learned

## Contact Information

### Emergency Contacts

- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Infrastructure Team**: <infrastructure@sav3.app>
- **Management Escalation**: <leadership@sav3.app>

### External Vendors

- **Cloud Provider**: AWS Support (Enterprise)
- **Monitoring Service**: DataDog/New Relic Support
- **Backup Service**: Vendor-specific support contacts

## Appendices

### A. Configuration Files

- Database configuration templates
- Media storage configuration templates
- Monitoring configuration templates

### B. Network Diagrams

- Production architecture diagram
- DR architecture diagram
- Network flow diagrams

### C. Runbook Checklists

- Pre-incident preparation checklist
- Incident response checklist
- Post-incident review checklist

---

**Last Updated**: August 26, 2025
**Version**: 1.0
**Owner**: DevOps Team
**Review Cycle**: Quarterly
