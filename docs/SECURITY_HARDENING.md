# Security Hardening & Secrets Management Documentation

This document details the security hardening and secrets management
implementation for the SAV3 backend infrastructure.

## Overview

The security stack provides comprehensive protection through:

- **TLS/SSL encryption** for all database and service communications
- **Role-based access control** with principle of least privilege
- **Secrets management** using HashiCorp Vault
- **Password rotation** automation
- **Security monitoring** and health checks
- **Hardened configurations** for PostgreSQL and PgBouncer

## Architecture

### Components

- **HashiCorp Vault**: Centralized secrets management
- **TLS/SSL**: Encryption for all communications
- **Certificate Management**: Automated certificate generation and rotation
- **Role Separation**: Dedicated users for different functions
- **Security Monitoring**: Health checks and alerting

### Security Layers

1. **Network Security**: Custom Docker networks with isolation
2. **Transport Security**: TLS 1.3 encryption for all connections
3. **Authentication**: SCRAM-SHA-256 for database authentication
4. **Authorization**: Role-based access control
5. **Data Security**: Encryption at rest and in transit
6. **Secrets Management**: Vault-managed credentials with rotation

## Implementation

### 1. TLS/SSL Configuration

#### Certificate Generation

```bash
# Generate SSL certificates
./scripts/security/generate-ssl-certs.sh

# Certificates created:
# - /etc/ssl/certs/ca.crt (Certificate Authority)
# - /etc/ssl/certs/server.crt (Server certificate)
# - /etc/ssl/certs/server.key (Server private key)
# - /etc/ssl/certs/client.crt (Client certificate)
# - /etc/ssl/certs/client.key (Client private key)
```

#### PostgreSQL TLS

- **SSL Mode**: Required for all connections
- **Certificate Authentication**: Client certificates for replication
- **Cipher Suites**: Strong encryption algorithms only
- **Protocol**: TLS 1.3 preferred

#### PgBouncer TLS

- **Server Connections**: TLS required
- **Client Connections**: TLS preferred
- **Certificate Validation**: Full certificate chain validation
- **Secure Ciphers**: ECDHE-based cipher suites

### 2. HashiCorp Vault Setup

#### Deployment

```bash
# Start security stack
docker-compose -f docker-compose.security.yml up -d

# Initialize Vault
./scripts/security/vault-setup.sh setup
```

#### Vault Configuration

- **Storage**: File-based storage with encryption
- **Authentication**: Token-based with policies
- **TLS**: Required for all API communications
- **Audit Logging**: Comprehensive audit trail
- **Auto-Unseal**: Configured for production use

#### Secrets Structure

```text
kv/
├── database/
│   ├── admin (postgres superuser)
│   ├── app (application user)
│   ├── replica (replication user)
│   └── backup (backup user)
└── api/
    ├── jwt (JWT secrets)
    └── stripe (Stripe webhook secrets)
```

### 3. Role-Based Access Control

#### Database Users

- **postgres**: Superuser for administration
- **sav3_app**: Application user with minimal privileges
- **replicator**: Replication user for streaming replication
- **backup_user**: Backup operations with read-only access
- **monitoring**: Metrics collection with limited access

#### Vault Policies

- **database-secrets**: Access to database credentials
- **api-secrets**: Access to API secrets
- **admin-secrets**: Full access for administrators

### 4. Password Rotation

#### Automated Rotation

```bash
# Rotate all passwords
./scripts/security/rotate-passwords.sh all

# Rotate specific passwords
./scripts/security/rotate-passwords.sh app
./scripts/security/rotate-passwords.sh replication
./scripts/security/rotate-passwords.sh backup
./scripts/security/rotate-passwords.sh api
./scripts/security/rotate-passwords.sh stripe
```

#### Rotation Schedule

- **Database Passwords**: Every 30 days
- **API Secrets**: Every 90 days
- **Certificates**: Every 365 days
- **Vault Tokens**: Every 24 hours

### 5. Hardened Configurations

#### PostgreSQL Security (`postgresql.conf`)

```ini
# TLS Configuration
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/certs/server.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'

# Security Settings
password_encryption = scram-sha-256
log_connections = on
log_disconnections = on
log_checkpoints = on
```

#### PostgreSQL Access Control (`pg_hba.conf`)

```text
# Secure authentication methods
hostssl all all 0.0.0.0/0 scram-sha-256
hostssl replication replicator 0.0.0.0/0 cert
local all postgres peer
```

#### PgBouncer Security (`pgbouncer-secure.ini`)

- **Authentication**: SCRAM-SHA-256
- **TLS**: Required for server connections
- **Connection Limits**: Strict limits to prevent abuse
- **Logging**: Comprehensive connection logging

## Usage

### 1. Initial Setup

```bash
# Generate certificates
./scripts/security/generate-ssl-certs.sh

# Generate initial secrets
./scripts/security/generate-secrets.sh

# Start security stack
docker-compose -f docker-compose.security.yml up -d

# Initialize Vault
./scripts/security/vault-setup.sh setup
```

### 2. Application Configuration

```bash
# Get database connection string from Vault
vault kv get -field=connection_string kv/database/app

# Get JWT secrets for application
vault kv get kv/api/jwt
```

### 3. Monitoring and Maintenance

```bash
# Run security health check
./scripts/security/check-security-health.sh

# Check specific components
./scripts/security/check-security-health.sh vault
./scripts/security/check-security-health.sh postgres
./scripts/security/check-security-health.sh certs

# Rotate passwords
./scripts/security/rotate-passwords.sh all
```

## Security Checklist

### Pre-Production

- [ ] SSL certificates generated and validated
- [ ] Vault initialized and unsealed
- [ ] Database passwords rotated
- [ ] API secrets generated and stored
- [ ] Security policies configured
- [ ] Health checks passing

### Ongoing Maintenance

- [ ] Certificate expiration monitoring
- [ ] Password rotation schedule maintained
- [ ] Security health checks scheduled
- [ ] Vault backup and recovery tested
- [ ] Access logs reviewed regularly

### Incident Response

- [ ] Emergency password rotation procedure
- [ ] Certificate revocation process
- [ ] Vault emergency unsealing
- [ ] Security event logging and alerting

## Integration with Existing Stack

### Prisma Configuration

```typescript
// Use Vault-managed connection string
const connectionString = await getSecretFromVault(
  "kv/database/app",
  "connection_string"
);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});
```

### Environment Variables

```bash
# Replace static secrets with Vault references
DATABASE_URL="vault:kv/database/app#connection_string"
JWT_ACCESS_SECRET="vault:kv/api/jwt#access_secret"
JWT_REFRESH_SECRET="vault:kv/api/jwt#refresh_secret"
```

## Troubleshooting

### Common Issues

1. **Certificate Validation Errors**
   - Check certificate expiration dates
   - Verify certificate chain completeness
   - Validate certificate permissions (600)

2. **Vault Unsealing Issues**
   - Check for init keys file `/tmp/vault/init-keys.json`
   - Verify unseal key count and threshold
   - Check Vault logs for specific errors

3. **Database Connection Failures**
   - Verify SSL certificate configuration
   - Check pg_hba.conf for correct authentication methods
   - Test connection with correct SSL parameters

4. **Password Rotation Failures**
   - Check Vault token validity and permissions
   - Verify database connectivity
   - Review rotation logs for specific errors

### Recovery Procedures

```bash
# Emergency Vault unseal
./scripts/security/vault-setup.sh unseal

# Reset database passwords
./scripts/security/rotate-passwords.sh all

# Regenerate certificates
./scripts/security/generate-ssl-certs.sh --force

# Full security health check
./scripts/security/check-security-health.sh
```

## Performance Impact

The security hardening has minimal performance impact:

- **TLS Overhead**: ~2-5% CPU increase
- **Authentication**: ~1ms additional latency
- **Vault Lookups**: Cached for 5 minutes
- **Certificate Validation**: Minimal overhead with proper caching

## Compliance and Standards

This implementation addresses:

- **SOC 2 Type II**: Security controls and monitoring
- **PCI DSS**: Encryption and access controls
- **GDPR**: Data protection and encryption at rest
- **HIPAA**: Administrative, physical, and technical safeguards

---

For additional security questions or incident response, refer to the security runbook or contact the security team.
