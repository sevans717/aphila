# Monitoring & Observability Stack

This document describes the comprehensive monitoring and observability stack for the SAV3 PostgreSQL database and application infrastructure.

## Overview

The monitoring stack provides comprehensive visibility into:

- **PostgreSQL Performance**: Connections, queries, replication lag, cache hit ratios
- **Connection Pooling**: PgBouncer metrics and pool utilization
- **System Resources**: CPU, memory, disk usage via Node Exporter
- **Application Metrics**: Custom application metrics (if enabled)
- **Alerting**: Proactive alerts for critical conditions

## Architecture

### Components

1. **PostgreSQL with Monitoring Extensions**
   - `pg_stat_statements` extension for query performance tracking
   - Enhanced logging configuration for monitoring
   - Monitoring user for secure metrics collection

2. **Prometheus** - Time-series metrics collection
   - Scrapes metrics from all exporters
   - Stores 30 days of metrics data
   - Evaluates alerting rules

3. **Grafana** - Visualization and dashboards
   - Pre-configured PostgreSQL dashboard
   - Data source automatically configured
   - Admin user: `admin/admin` (change in production)

4. **AlertManager** - Alert routing and notification
   - Webhook integration for application notifications
   - Email notifications (configurable)
   - Alert grouping and inhibition rules

5. **Exporters**
   - **PostgreSQL Exporter**: Database metrics and custom queries
   - **PgBouncer Exporter**: Connection pool metrics
   - **Node Exporter**: System/hardware metrics

## Quick Start

### Starting the Monitoring Stack

```bash
# Start all monitoring services
scripts/monitoring-health/start-monitoring-stack.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.monitoring.yml up -d
```

### Accessing Services

- **Grafana Dashboard**: http://localhost:3000 (`admin/admin`)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093
- **PostgreSQL Metrics**: http://localhost:9187/metrics
- **PgBouncer Metrics**: http://localhost:9127/metrics
- **System Metrics**: http://localhost:9100/metrics

### Health Check

```bash
# Run comprehensive health check
scripts/monitoring-health/check-monitoring-health.sh
```

## Configuration

### Environment Variables

Set in your `.env` file:

```env
# PostgreSQL settings (for monitoring)
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=postgres
POSTGRES_DB=sav3

# Grafana admin password
GRAFANA_ADMIN_PASSWORD=your_admin_password
```

### Custom Metrics Queries

Custom PostgreSQL metrics are defined in `docker/postgres-exporter/queries.yaml`:

- **Replication metrics**: Lag, LSN positions, sync state
- **Database statistics**: Transactions, cache hits, deadlocks
- **Query performance**: Slow queries from pg_stat_statements
- **Table statistics**: Tuple counts, vacuum/analyze stats
- **Connection states**: Active, idle, waiting connections

## Dashboards

### Pre-configured Dashboards

1. **PostgreSQL Monitoring Dashboard** (`postgres-dashboard`)
   - Connection counts vs limits
   - Replication lag monitoring
   - Cache hit ratio trends
   - Transaction rates (commits/rollbacks)
   - Database size growth
   - PgBouncer connection pool status

### Creating Custom Dashboards

1. Access Grafana at http://localhost:3000
2. Login with `admin/admin`
3. Click "+" → "Dashboard"
4. Add panels using Prometheus as data source
5. Use PromQL queries to create visualizations

## Alerting

### Pre-configured Alerts

**Critical Alerts**:

- PostgreSQL service down
- Maximum connections reached (>95%)
- Replication broken
- Disk space critically low (<10%)

**Warning Alerts**:

- High connection usage (>80%)
- High replication lag (>30s)
- Low cache hit ratio (<90%)
- High deadlock rate
- System resource usage (CPU >80%, Memory >80%)

### Alert Configuration

Edit `docker/alertmanager/alertmanager.yml` to configure:

- Email notifications
- Webhook endpoints
- Alert grouping rules
- Notification timing

### Custom Alert Rules

Add new rules to `docker/prometheus/rules/alerts.yml`:

```yaml
- alert: CustomAlert
  expr: your_prometheus_query > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert description"
    description: "Detailed alert information"
```

## Metrics Reference

### Key PostgreSQL Metrics

| Metric                         | Description                     | Type    |
| ------------------------------ | ------------------------------- | ------- |
| `pg_up`                        | PostgreSQL service availability | Gauge   |
| `pg_stat_database_numbackends` | Active connections              | Gauge   |
| `pg_settings_max_connections`  | Maximum allowed connections     | Gauge   |
| `pg_replication_lag`           | Replication lag in seconds      | Gauge   |
| `pg_stat_database_xact_commit` | Committed transactions          | Counter |
| `pg_stat_database_blks_hit`    | Buffer cache hits               | Counter |
| `pg_stat_database_blks_read`   | Disk block reads                | Counter |

### Key PgBouncer Metrics

| Metric                       | Description                | Type  |
| ---------------------------- | -------------------------- | ----- |
| `pgbouncer_pools_cl_active`  | Active client connections  | Gauge |
| `pgbouncer_pools_cl_waiting` | Waiting client connections | Gauge |
| `pgbouncer_pools_sv_active`  | Active server connections  | Gauge |
| `pgbouncer_pools_maxwait`    | Maximum pool size          | Gauge |

## Maintenance

### Log Management

View monitoring service logs:

```bash
# All services
docker-compose -f docker-compose.monitoring.yml logs

# Specific service
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana
```

### Data Retention

- **Prometheus**: 30 days retention (configurable in `prometheus.yml`)
- **Grafana**: Persistent dashboards and configurations
- **AlertManager**: Alert history retention based on configuration

### Backup Considerations

Important data to backup:

- `grafana_data` volume: Dashboards and settings
- `prometheus_data` volume: Metrics data (optional)
- Configuration files: All files in `docker/` subdirectories

### Updates and Upgrades

1. Stop the monitoring stack:

   ```bash
   docker-compose -f docker-compose.monitoring.yml down
   ```

2. Update image versions in `docker-compose.monitoring.yml`

3. Restart the stack:
   ```bash
   scripts/monitoring-health/start-monitoring-stack.sh
   ```

## Security Considerations

### Network Security

- Monitoring services are on isolated Docker network
- Only necessary ports exposed to host
- Use strong passwords for admin accounts

### Authentication

- Change default Grafana admin password
- Configure proper SMTP settings for alert emails
- Use bearer tokens for webhook authentication

### Monitoring User Permissions

The monitoring database user has minimal required permissions:

- `CONNECT` on database
- `SELECT` on system tables and views
- No write permissions to application data

## Troubleshooting

### Common Issues

**Service won't start**:

```bash
# Check service status
docker-compose -f docker-compose.monitoring.yml ps

# View service logs
docker-compose -f docker-compose.monitoring.yml logs [service_name]
```

**Metrics not appearing**:

1. Verify exporters are running and accessible
2. Check Prometheus targets page: http://localhost:9090/targets
3. Validate Prometheus configuration and restart if needed

**Grafana dashboard empty**:

1. Verify Prometheus data source configuration
2. Check if metrics are being collected in Prometheus
3. Verify query syntax in dashboard panels

**Alerts not firing**:

1. Check AlertManager configuration and logs
2. Verify alert rules in Prometheus rules page
3. Test webhook endpoints and email settings

### Performance Tuning

**High resource usage**:

- Reduce Prometheus retention period
- Decrease scrape intervals for non-critical metrics
- Limit the number of time series collected

**Storage optimization**:

- Monitor disk usage of Prometheus data volume
- Configure appropriate retention policies
- Use external storage for long-term retention if needed

## Integration with Application

### Application Metrics Endpoint

Add to your application (already configured in scrape config):

```javascript
// Express.js with prom-client
const client = require("prom-client");
const register = client.register;

app.get("/metrics", (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
});
```

### Alert Webhook Integration

Configure AlertManager webhook to send alerts to your application:

```yaml
receivers:
  - name: "app-webhook"
    webhook_configs:
      - url: "http://host.docker.internal:10000/api/webhooks/alerts"
        send_resolved: true
```

The application can then process alerts and create notifications, logs, or trigger automated responses.

## Conclusion

This monitoring stack provides comprehensive observability for your PostgreSQL database and infrastructure. Regular monitoring of these metrics helps ensure optimal performance, early problem detection, and reliable database operations.

For additional metrics or custom dashboards, refer to the Prometheus and Grafana documentation, or extend the existing configuration files.
