# PgBouncer Connection Pooling & Optimization Guide

This document covers the optimized PgBouncer setup for the SAV3 backend, including configuration, monitoring, and integration with Prisma.

## Architecture Overview

The connection pooling system includes:

- **Optimized PgBouncer**: Transaction-mode pooling with intelligent sizing
- **Primary/Replica Support**: Separate pools for read/write operations
- **Health Monitoring**: Real-time pool status and metrics
- **Prisma Integration**: Connection pool configuration for optimal performance

## Files and Configuration

### Docker Compose

- `docker-compose.pgbouncer.yml` - Complete PgBouncer infrastructure
- `pgbouncer/pgbouncer-optimized.ini` - Tuned configuration file
- `docker/pgbouncer-config/` - Userlist generation container
- `docker/pgbouncer-monitor/` - Monitoring and health checking

### Prisma Integration

- `src/lib/prisma.ts` - Enhanced Prisma client with pooling support
- Database connection health checks and replica support

### Operational Scripts

- `scripts/check-pgbouncer-health.sh` - Comprehensive health monitoring
- `scripts/tune-pgbouncer.sh` - Automatic configuration tuning
- `scripts/generate-pgbouncer-userlist.sh` - User authentication setup

## Quick Start

### 1. Start PgBouncer Infrastructure

```bash
# Start the complete stack with PgBouncer
docker compose -f docker-compose.pgbouncer.yml up --build -d

# Or use with existing setup
docker compose -f docker-compose.yml -f docker-compose.pgbouncer.yml up -d
```

### 2. Verify Connection Pooling

```bash
# Check PgBouncer health and statistics
./scripts/check-pgbouncer-health.sh

# Check monitoring endpoint
curl http://localhost:8081
```

### 3. Test Application Connectivity

```bash
# Test database connection through PgBouncer
psql "postgresql://postgres:postgres@localhost:6432/sav3" -c "SELECT version();"

# Run application with pooled connections
npm start
```

## Configuration Details

### Pool Sizing Strategy

The configuration is optimized for transaction pooling:

```ini
pool_mode = transaction
max_client_conn = 200          # Maximum client connections
default_pool_size = 25         # Connections per database/user
min_pool_size = 5              # Always-open connections
reserve_pool_size = 5          # Emergency connection reserve
max_db_connections = 50        # Total backend connections
```

### Timeout Configuration

```ini
server_lifetime = 3600         # Recycle connections hourly
server_idle_timeout = 600      # Close idle connections after 10min
query_wait_timeout = 120       # Queue timeout for new queries
client_idle_timeout = 0        # No client timeout (handled by app)
```

### Performance Tuning

```ini
tcp_keepalive = 1              # Enable TCP keepalive
server_reset_query = DISCARD ALL  # Clean connection state
ignore_startup_parameters = extra_float_digits,search_path
```

## Environment Variables

### Required Configuration

```bash
# Database connection
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=sav3
SAV3_USER=sav3_user
SAV3_PASSWORD=sav3_app_password

# Replica configuration (optional)
DATABASE_URL_REPLICA=postgresql://postgres:password@db-replica:5432/sav3

# Prisma pool settings
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=20000
DATABASE_SOCKET_TIMEOUT=30000
```

### Docker Compose Environment

The Docker Compose automatically configures:

- Primary database access through PgBouncer (port 6432)
- Replica database for read queries (port 5432)
- Health monitoring endpoint (port 8081)
- Automatic userlist generation

## Prisma Integration

### Enhanced Client Configuration

The Prisma client includes:

```typescript
// Primary connection (read/write)
export { prisma };

// Replica connection (read-only)
export { prismaReplica };

// Health checking
export const checkDatabaseConnection = async (): Promise<{
  primary: boolean;
  replica: boolean;
  latency: { primary: number; replica?: number };
}>;
```

### Usage Patterns

```typescript
import { prisma, prismaReplica } from "@/lib/prisma";

// Write operations use primary
const user = await prisma.user.create({ data: userData });

// Read operations can use replica
const users = await prismaReplica.user.findMany();

// Transactions always use primary
await prisma.$transaction([
  prisma.user.create({ data: user1 }),
  prisma.profile.create({ data: profile1 }),
]);
```

## Monitoring and Health Checks

### Health Monitoring Endpoint

PgBouncer monitoring is available at `http://localhost:8081`:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-26T15:30:00Z",
  "pools": 3,
  "clients": 15,
  "servers": 8,
  "databases": 2,
  "messages": [],
  "pool_details": "sav3 | postgres | 5 | 2 | 3 | 0 | 0 | ..."
}
```

### Manual Health Checks

```bash
# Comprehensive PgBouncer health check
./scripts/check-pgbouncer-health.sh

# Check application database connectivity
curl http://localhost:4000/health
```

### PgBouncer Administration

```bash
# Connect to PgBouncer admin
psql "postgresql://postgres:password@localhost:6432/pgbouncer"

# View pool status
pgbouncer=# SHOW POOLS;
pgbouncer=# SHOW CLIENTS;
pgbouncer=# SHOW SERVERS;
pgbouncer=# SHOW STATS;

# Reload configuration
pgbouncer=# RELOAD;

# Graceful shutdown pool
pgbouncer=# SHUTDOWN;
```

## Performance Optimization

### Automatic Configuration Tuning

```bash
# Auto-tune based on system resources
./scripts/tune-pgbouncer.sh

# Specify custom config file
./scripts/tune-pgbouncer.sh ./custom-pgbouncer.ini
```

### Manual Tuning Guidelines

1. **Pool Size**: Start with `2 × CPU cores` for `default_pool_size`
2. **Client Connections**: Set to `10 × default_pool_size` for `max_client_conn`
3. **Backend Connections**: Set to `2 × default_pool_size` for `max_db_connections`
4. **Monitor Utilization**: Adjust based on actual usage patterns

### Performance Metrics to Monitor

- **Pool utilization**: Should stay below 80% under normal load
- **Wait times**: `maxwait` should be minimal
- **Connection churn**: Monitor `sv_login` rate
- **Query distribution**: Balance between read and write queries

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**

   ```bash
   # Check current pool usage
   psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SHOW POOLS;"

   # Increase pool size temporarily
   psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SET default_pool_size=30;"
   ```

2. **Authentication Failures**

   ```bash
   # Regenerate userlist
   docker compose -f docker-compose.pgbouncer.yml restart pgbouncer-config

   # Check user permissions
   psql -h localhost -p 5432 -U postgres -d sav3 -c "\du"
   ```

3. **High Connection Latency**

   ```bash
   # Check backend connection status
   psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SHOW SERVERS;"

   # Monitor TCP connections
   netstat -an | grep :6432
   ```

### Debug Commands

```bash
# Enable verbose logging
docker compose -f docker-compose.pgbouncer.yml exec pgbouncer \
  sed -i 's/log_connections = 1/log_connections = 1\nverbose = 2/' /etc/pgbouncer/pgbouncer.ini

# View PgBouncer logs
docker compose -f docker-compose.pgbouncer.yml logs pgbouncer

# Test specific database connection
pgbench -h localhost -p 6432 -U postgres -d sav3 -c 10 -j 2 -t 100
```

## Production Considerations

### Security Hardening

1. **Authentication**: Use strong passwords and consider certificate-based auth
2. **Network**: Restrict PgBouncer access to application containers only
3. **Monitoring**: Integrate health endpoint with monitoring system
4. **Secrets**: Use Docker secrets or external secret management

### High Availability

1. **Multiple PgBouncer Instances**: Deploy behind load balancer
2. **Health Checks**: Configure container orchestration health checks
3. **Failover**: Implement automatic failover to replica databases
4. **Backup Connections**: Configure fallback direct database connections

### Performance Monitoring

Integrate with monitoring systems:

- **Prometheus**: Scrape metrics from monitoring endpoint
- **Grafana**: Create dashboards for pool utilization and performance
- **Alerting**: Set alerts for connection exhaustion and high latency

## Integration with Existing System

This PgBouncer setup integrates with:

- Existing PostgreSQL containers
- Prisma ORM with enhanced client configuration
- Docker Compose infrastructure
- Backup and replication systems
- Monitoring and health check systems

The system is designed to be backward compatible and can run alongside existing database connections during migration.
