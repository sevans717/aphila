# Zero-Downtime Migration Guide

This document provides comprehensive guidance for implementing and using the zero-downtime migration system in the SAV3 application.

## Overview

The zero-downtime migration system uses a blue-green deployment strategy to execute database migrations without service interruption. This approach ensures high availability during schema changes and provides safe rollback capabilities.

## Architecture

### Components

1. **Blue-Green Database Environments**
   - `postgres-blue`: Primary database environment
   - `postgres-green`: Secondary database environment for migrations
   - Environments are swapped during migration execution

2. **Migration Proxy**
   - Nginx-based proxy routing database traffic
   - Provides seamless switching between blue and green environments
   - Health checking and automatic failover capabilities

3. **Migration Controller**
   - Node.js application managing migration execution
   - Schema validation and risk assessment
   - Rollback automation and backup management

4. **Automation Scripts**
   - Migration execution orchestration
   - Health monitoring and validation
   - Backup and restore operations

## Migration Types

### Safe Migrations (No Downtime)

- Adding new columns (with defaults)
- Creating indexes concurrently
- Adding constraints (non-blocking)
- Creating new tables

**Characteristics:**

- Execute directly on active environment
- No traffic switching required
- Minimal risk of data loss or corruption

### Risky Migrations (Blue-Green Required)

- Dropping columns or tables
- Altering column types
- Adding NOT NULL constraints to existing columns
- Renaming tables or columns

**Characteristics:**

- Requires blue-green deployment
- Data synchronization between environments
- Traffic switching after validation
- Rollback capabilities essential

### Maintenance Migrations (Planned Downtime)

- Major schema restructuring
- Data migrations requiring exclusive access
- Operations that cannot be performed online

**Characteristics:**

- Requires application downtime
- Direct execution on primary database
- Full backup before execution

## Usage Guide

### Prerequisites

1. **Environment Setup**

   ```bash
   # Ensure Docker and Docker Compose are installed
   docker --version
   docker-compose --version

   # Verify migration stack configuration
   cd /path/to/sav3-backend
   docker-compose -f docker-compose.migrations.yml config
   ```

2. **Environment Variables**

   ```bash
   # Required environment variables
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=sav3_app
   export DB_USER=postgres
   export DB_PASSWORD=your_password
   ```

### Starting the Migration Infrastructure

```bash
# Start the complete migration stack
docker-compose -f docker-compose.migrations.yml up -d

# Verify all services are running
docker-compose -f docker-compose.migrations.yml ps

# Run health checks
./scripts/migration/check-migration-health.sh
```

### Executing Migrations

#### Safe Migration Example

```bash
# Execute a safe migration (adding a column)
./scripts/migration/execute-migration.sh \
  --type safe \
  migrations/001_add_user_preferences.sql
```

#### Risky Migration Example

```bash
# Execute a risky migration with dry run first
./scripts/migration/execute-migration.sh \
  --type risky \
  --dry-run \
  migrations/002_drop_unused_table.sql

# Execute after validation
./scripts/migration/execute-migration.sh \
  --type risky \
  --yes \
  migrations/002_drop_unused_table.sql
```

#### Maintenance Migration Example

```bash
# Execute maintenance migration with confirmation
./scripts/migration/execute-migration.sh \
  --type maintenance \
  migrations/003_major_schema_change.sql
```

### Migration Script Options

- `--type safe|risky|maintenance`: Migration risk level
- `--dry-run`: Validate without executing
- `--yes`: Auto-confirm all prompts
- `--no-rollback`: Disable automatic rollback
- `--timeout SECONDS`: Health check timeout
- `--switch-delay SECONDS`: Proxy switch delay

## Schema Validation

The migration system includes comprehensive schema validation:

### Validation Features

1. **Operation Analysis**
   - SQL statement parsing and classification
   - Risk level assessment (LOW, MEDIUM, HIGH)
   - Allowed operation enforcement

2. **Safety Checks**
   - Destructive operation warnings
   - NOT NULL constraint validation
   - Table rewrite detection

3. **Compatibility Verification**
   - PostgreSQL version compatibility
   - Extension requirement validation
   - Dependency conflict detection

### Example Validation Output

```json
{
  "isValid": true,
  "operations": [
    {
      "type": "ADD_COLUMN",
      "statement": "ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'",
      "riskLevel": "LOW"
    }
  ],
  "warnings": [],
  "errors": [],
  "riskLevel": "LOW"
}
```

## Rollback Procedures

### Automatic Rollback

The system creates automatic rollback points before migration execution:

```bash
# Rollback points are automatically created in:
/var/lib/postgresql/backups/rollback-<migration-id>-<timestamp>.sql
```

### Manual Rollback

```bash
# List available rollback points
ls -la /var/lib/postgresql/backups/rollback-*

# Execute manual rollback
docker-compose -f docker-compose.migrations.yml exec migration-controller \
  node /app/src/schema-validator.js rollback /var/lib/postgresql/backups/rollback-001-2024-01-15.sql
```

### Emergency Rollback

```bash
# Switch proxy back to previous environment
docker-compose -f docker-compose.migrations.yml exec migration-proxy \
  /usr/local/bin/proxy-switch.sh blue

# Restart old environment if needed
docker-compose -f docker-compose.migrations.yml up -d postgres-blue
```

## Monitoring and Health Checks

### Automated Health Monitoring

```bash
# Comprehensive health check
./scripts/migration/check-migration-health.sh

# Continuous monitoring (every 30 seconds)
watch -n 30 './scripts/migration/check-migration-health.sh'
```

### Health Check Components

1. **Service Availability**
   - Database connectivity
   - Proxy functionality
   - Controller accessibility

2. **Performance Metrics**
   - Response time monitoring
   - Connection pool status
   - Resource utilization

3. **Data Integrity**
   - Schema consistency validation
   - Replication lag monitoring
   - Backup verification

## Best Practices

### Migration Development

1. **Test Migrations Locally**

   ```bash
   # Always test with dry-run first
   ./scripts/migration/execute-migration.sh --type risky --dry-run migration.sql
   ```

2. **Use Appropriate Migration Types**
   - Safe: Non-blocking operations only
   - Risky: Operations requiring blue-green deployment
   - Maintenance: Operations requiring downtime

3. **Write Rollback-Safe Migrations**
   - Avoid irreversible operations in risky migrations
   - Include data migration scripts when needed
   - Test rollback procedures

### Production Deployment

1. **Pre-Migration Checklist**
   - [ ] Migration tested in staging environment
   - [ ] Backup verification completed
   - [ ] Health check baseline established
   - [ ] Rollback procedure documented
   - [ ] Team notification sent

2. **During Migration**
   - Monitor health checks continuously
   - Validate application functionality after switch
   - Keep rollback window available
   - Document any issues encountered

3. **Post-Migration**
   - Verify data integrity
   - Monitor performance metrics
   - Clean up old environments
   - Update documentation

## Troubleshooting

### Common Issues

1. **Migration Validation Fails**

   ```bash
   # Check migration syntax
   docker-compose -f docker-compose.migrations.yml exec migration-controller \
     node /app/src/schema-validator.js validate /migrations/migration.sql
   ```

2. **Proxy Switch Fails**

   ```bash
   # Check proxy status
   docker-compose -f docker-compose.migrations.yml exec migration-proxy \
     /usr/local/bin/proxy-switch.sh status

   # Manual proxy configuration check
   docker-compose -f docker-compose.migrations.yml exec migration-proxy \
     nginx -t
   ```

3. **Database Connectivity Issues**

   ```bash
   # Test database connectivity
   docker-compose -f docker-compose.migrations.yml exec postgres-blue \
     pg_isready -U postgres

   # Check database logs
   docker-compose -f docker-compose.migrations.yml logs postgres-blue
   ```

4. **Performance Degradation**

   ```bash
   # Check active connections
   docker-compose -f docker-compose.migrations.yml exec postgres-blue \
     psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

   # Monitor resource usage
   docker stats $(docker-compose -f docker-compose.migrations.yml ps -q)
   ```

### Recovery Procedures

1. **Failed Migration Recovery**

   ```bash
   # Stop migration stack
   docker-compose -f docker-compose.migrations.yml down

   # Restore from backup if needed
   # Restart with clean state
   docker-compose -f docker-compose.migrations.yml up -d
   ```

2. **Data Corruption Recovery**
   ```bash
   # Execute rollback to last known good state
   docker-compose -f docker-compose.migrations.yml exec migration-controller \
     node /app/src/schema-validator.js rollback <backup-file>
   ```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
# Example workflow step
- name: Run Database Migration
  run: |
    ./scripts/migration/execute-migration.sh \
      --type safe \
      --yes \
      --timeout 120 \
      ${{ github.workspace }}/migrations/latest.sql
```

### Automated Testing

```bash
# Include migration testing in CI pipeline
npm run test:migrations

# Validate migration scripts in PR builds
./scripts/migration/execute-migration.sh --dry-run migrations/*.sql
```

## Security Considerations

1. **Access Control**
   - Migration users have minimal required permissions
   - Separate credentials for blue/green environments
   - Audit logging for all migration operations

2. **Data Protection**
   - Encrypted backups for sensitive data
   - Secure transmission between environments
   - Rollback point encryption

3. **Network Security**
   - Internal Docker network isolation
   - TLS encryption for database connections
   - Proxy authentication where applicable

## Performance Optimization

1. **Migration Timing**
   - Schedule risky migrations during low-traffic periods
   - Use concurrent indexes where possible
   - Batch large data operations

2. **Resource Allocation**
   - Adequate memory for blue-green environments
   - Sufficient disk space for backups
   - CPU resources for migration processing

3. **Connection Management**
   - Connection pooling configuration
   - Timeout optimization
   - Connection limit monitoring

## Maintenance

### Regular Tasks

1. **Backup Cleanup**

   ```bash
   # Automated cleanup runs daily, but manual cleanup available
   find /var/lib/postgresql/backups -name "rollback-*" -mtime +7 -delete
   ```

2. **Health Check Validation**

   ```bash
   # Weekly comprehensive health check
   ./scripts/migration/check-migration-health.sh > migration-health-$(date +%Y%m%d).log
   ```

3. **Performance Baseline Updates**
   ```bash
   # Update performance baselines monthly
   ./scripts/migration/performance-baseline.sh --update
   ```

### Monitoring and Alerting

1. **Log Monitoring**
   - Migration execution logs
   - Database error logs
   - Proxy access logs

2. **Metrics Collection**
   - Migration duration tracking
   - Success/failure rates
   - Performance impact measurement

3. **Alert Configuration**
   - Failed migration notifications
   - Performance degradation alerts
   - Health check failure alerts

## Conclusion

The zero-downtime migration system provides a robust framework for database schema evolution without service interruption. By following the guidelines and best practices outlined in this document, teams can safely execute database migrations while maintaining high availability and data integrity.

For additional support or questions, refer to the troubleshooting section or consult the development team.
