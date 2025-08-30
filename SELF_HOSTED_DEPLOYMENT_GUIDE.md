# Self-Hosted Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Sav3 dating app in a fully self-hosted environment. All cloud dependencies have been replaced with self-hosted alternatives to ensure complete control over your infrastructure and data.

## Self-Hosted Services Architecture

### Infrastructure Components

#### 1. Database Layer (PostgreSQL + PostGIS)

- **Service**: PostgreSQL 16.3 with PostGIS 3.4 extension
- **Purpose**: Primary data storage with geospatial capabilities
- **Self-Hosted Alternative**: ✅ Already implemented
- **Configuration**: Connection pooling via PgBouncer

#### 2. Media Storage (MinIO)

- **Service**: MinIO S3-compatible object storage
- **Purpose**: File uploads, profile photos, media assets
- **Self-Hosted Alternative**: ✅ Already implemented
- **Configuration**: Local storage with optional CDN integration

#### 3. Push Notifications (Custom Service)

- **Service**: Custom push notification service
- **Purpose**: Real-time notifications for matches, messages
- **Self-Hosted Alternative**: ✅ Already implemented
- **Configuration**: Web Push (VAPID), iOS (APNs), Android (FCM-like)

#### 4. Caching & Sessions (Redis)

- **Service**: Redis for caching and session management
- **Purpose**: Performance optimization and real-time features
- **Self-Hosted Alternative**: ✅ Already implemented

#### 5. Reverse Proxy & Load Balancing (Traefik)

- **Service**: Traefik for routing and SSL termination
- **Purpose**: API gateway, SSL certificates, load balancing
- **Self-Hosted Alternative**: ✅ Already implemented

#### 6. Monitoring & Observability

- **Services**: Prometheus, Grafana, Alertmanager
- **Purpose**: System monitoring, metrics, and alerting
- **Self-Hosted Alternative**: ✅ Already implemented

#### 7. Secrets Management (Vault)

- **Service**: HashiCorp Vault for secrets storage
- **Purpose**: Secure storage of credentials and certificates
- **Self-Hosted Alternative**: ✅ Already implemented

## Manual Deployment Steps

### Phase 1: Infrastructure Setup

#### 1.1 Server Provisioning

```bash
# Choose your hosting provider (VPS, dedicated server, or cloud instance)
# Recommended minimum specifications:
# - 4 CPU cores
# - 8GB RAM
# - 100GB SSD storage
# - Ubuntu 22.04 LTS or similar

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 1.2 Domain and DNS Configuration

```bash
# Configure DNS records for your domain
# Required subdomains:
# - api.aphila.io (API server)
# - minio.aphila.io (MinIO console)
# - vault.aphila.io (Vault UI)
# - grafana.aphila.io (Monitoring dashboard)
# - traefik.aphila.io (Traefik dashboard)
```

#### 1.3 SSL Certificate Setup

```bash
# Install certbot for Let's Encrypt certificates
sudo apt install certbot -y

# Generate wildcard certificate (requires DNS challenge)
sudo certbot certonly --manual --preferred-challenges=dns -d "*.yourdomain.com"

# Convert certificates to format expected by services
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/ssl/certs/yourdomain.com.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/ssl/private/yourdomain.com.key
```

### Phase 2: Environment Configuration

#### 2.1 Create Production Environment File

```bash
# Copy and modify the production environment template
cp .env.example.production .env.production

# Edit with your specific values
nano .env.production
```

**Required Environment Variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=4000
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database Configuration
DATABASE_URL=postgresql://sav3_prod_user:YOUR_STRONG_PASSWORD@pgbouncer:6432/sav3_prod
POSTGRES_USER=sav3_prod_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_DB=sav3_prod

# Authentication & Security
JWT_SECRET=YOUR_32_CHARACTER_JWT_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=YOUR_DIFFERENT_32_CHARACTER_SECRET
JWT_REFRESH_EXPIRES_IN=7d
JWT_ACCESS_SECRET=ANOTHER_32_CHARACTER_SECRET
ENCRYPTION_KEY=YOUR_32_CHARACTER_ENCRYPTION_KEY

# MinIO Configuration (Self-Hosted S3)
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_MINIO_SECRET_KEY
MINIO_BUCKET_NAME=sav3-media-prod
MINIO_USE_SSL=true

# VAPID Keys for Web Push Notifications
VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY

# Email Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
EMAIL_FROM=noreply@yourdomain.com

# Redis Configuration
REDIS_URL=redis://redis:6379
RATE_LIMIT_REDIS_URL=redis://redis:6379

# Vault Configuration
VAULT_ADDR=https://vault.yourdomain.com:8200
VAULT_TOKEN=YOUR_VAULT_TOKEN

# Monitoring
PROMETHEUS_METRICS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=YOUR_GRAFANA_PASSWORD
```

#### 2.2 Initialize Vault Secrets

```bash
# Start Vault service first
docker-compose -f docker-compose.security.yml up -d vault

# Initialize Vault (follow on-screen instructions)
docker-compose -f docker-compose.security.yml exec vault vault operator init

# Unseal Vault with the generated keys
docker-compose -f docker-compose.security.yml exec vault vault operator unseal

# Login to Vault
docker-compose -f docker-compose.security.yml exec vault vault login

# Create secrets engine
docker-compose -f docker-compose.security.yml exec vault vault secrets enable -path=secret kv-v2

# Store sensitive secrets
docker-compose -f docker-compose.security.yml exec vault vault kv put secret/sav3 \
  jwt_secret="YOUR_32_CHARACTER_JWT_SECRET" \
  db_password="YOUR_STRONG_DB_PASSWORD" \
  minio_access_key="YOUR_MINIO_ACCESS_KEY" \
  minio_secret_key="YOUR_MINIO_SECRET_KEY"
```

### Phase 3: Database Setup

#### 3.1 Initialize Database

```bash
# Start database services
docker-compose -f docker-compose.yml up -d postgres pgbouncer

# Wait for database to be ready
sleep 30

# Run database migrations
docker-compose -f docker-compose.yml exec api npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.yml exec api npx prisma generate

# Seed initial data (if needed)
docker-compose -f docker-compose.yml exec api npx prisma db seed
```

#### 3.2 Configure PostGIS

```bash
# Connect to database
docker-compose -f docker-compose.yml exec postgres psql -U sav3_prod_user -d sav3_prod

# Enable PostGIS extension (should already be done via init script)
CREATE EXTENSION IF NOT EXISTS postgis;

# Verify PostGIS installation
SELECT PostGIS_Version();
```

#### 3.3 Setup MinIO Buckets

```bash
# Start MinIO service
docker-compose -f docker-compose.media.yml up -d minio

# Configure MinIO client
docker-compose -f docker-compose.media.yml exec minio mc alias set local http://minio:9000 YOUR_MINIO_ACCESS_KEY YOUR_MINIO_SECRET_KEY

# Create required buckets
docker-compose -f docker-compose.media.yml exec minio mc mb local/sav3-media-prod
docker-compose -f docker-compose.media.yml exec minio mc mb local/sav3-thumbnails-prod

# Set bucket policies (allow public read for profile images)
docker-compose -f docker-compose.media.yml exec minio mc policy set download local/sav3-media-prod
```

### Phase 4: Service Deployment

#### 4.1 Start Core Services

```bash
# Start all services in order
docker-compose -f docker-compose.yml up -d
docker-compose -f docker-compose.media.yml up -d
docker-compose -f docker-compose.monitoring.yml up -d
docker-compose -f docker-compose.security.yml up -d
```

#### 4.2 Configure Reverse Proxy

```bash
# Update Traefik configuration with your domain
nano docker/traefik/traefik.yml

# Add your domain to the dynamic configuration
nano docker/traefik/dynamic.yml
```

#### 4.3 Setup SSL Termination

```bash
# Configure Traefik for SSL
# Ensure certificates are properly mounted
docker-compose -f docker-compose.yml up -d traefik
```

### Phase 5: Push Notification Setup

#### 5.1 Configure VAPID Keys

```bash
# Generate VAPID keys for web push notifications
npm install -g web-push
web-push generate-vapid-keys

# Add the generated keys to your .env.production file
VAPID_PUBLIC_KEY=BLcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7SroGWg2dgsK8h1w3k7z1w2k4h5m6n7o8p9q0
VAPID_PRIVATE_KEY=s9t8u7v6w5x4y3z2a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0
```

#### 5.2 Setup iOS Push Notifications (Optional)

```bash
# For iOS push notifications, you'll need:
# 1. Apple Developer Program membership
# 2. Push notification certificate from Apple
# 3. APNs certificate and private key

# Place certificates in the appropriate directory
mkdir -p config/push/ios
# Copy your APNs certificate and key here
```

#### 5.3 Setup Android Push Notifications (Optional)

```bash
# For Android, you can use FCM with your own server key
# or implement direct FCM API calls in the custom push service

# Add your FCM server key to environment
FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY
```

### Phase 6: Monitoring and Security

#### 6.1 Configure Monitoring

```bash
# Access Grafana
# URL: https://grafana.yourdomain.com
# Default credentials: admin / YOUR_GRAFANA_PASSWORD

# Configure Prometheus data sources
# Add PostgreSQL exporter, Redis exporter, and application metrics

# Setup alerting rules in Prometheus
nano docker/prometheus/alert_rules.yml
```

#### 6.2 Security Hardening

```bash
# Update firewall rules
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# Configure fail2ban for SSH protection
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Setup log rotation
sudo apt install logrotate -y
sudo nano /etc/logrotate.d/sav3
```

### Phase 7: Backup and Recovery

#### 7.1 Configure Backups

```bash
# Setup automated backups
docker-compose -f docker-compose.backups.yml up -d

# Test backup creation
docker-compose -f docker-compose.backups.yml exec backup-scheduler /scripts/backup.sh

# Verify backup integrity
docker-compose -f docker-compose.backups.yml exec backup-scheduler /scripts/verify-backup.sh
```

#### 7.2 Test Recovery Procedure

```bash
# Stop all services
docker-compose down

# Restore from backup
docker-compose -f docker-compose.backups.yml exec backup-scheduler /scripts/restore.sh

# Restart services
docker-compose up -d
```

### Phase 8: Performance Optimization

#### 8.1 Database Optimization

```bash
# Run database optimization script
docker-compose -f docker-compose.yml exec api /scripts/optimize-database.sh

# Monitor database performance
docker-compose -f docker-compose.monitoring.yml exec prometheus /scripts/database-metrics.sh
```

#### 8.2 Cache Configuration

```bash
# Configure Redis for optimal performance
docker-compose -f docker-compose.media.yml exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose -f docker-compose.media.yml exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Phase 9: Testing and Validation

#### 9.1 Health Checks

```bash
# Test all service health endpoints
curl https://api.yourdomain.com/api/v1/health
curl https://minio.yourdomain.com/minio/health/live
curl https://grafana.yourdomain.com/api/health
```

#### 9.2 Functional Testing

```bash
# Run comprehensive test suite
npm run test

# Test push notifications
curl -X POST https://api.yourdomain.com/api/v1/test/push \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "message": "Test notification"}'

# Test file upload
curl -X POST https://api.yourdomain.com/api/v1/upload \
  -F "file=@test-image.jpg"
```

### Phase 10: Production Go-Live

#### 10.1 Final Configuration

```bash
# Update DNS records to point to your server
# Configure CDN (optional) for static assets
# Setup monitoring alerts for your email/phone
# Configure log aggregation and analysis
```

#### 10.2 Documentation

```bash
# Update internal documentation
# Create runbooks for common issues
# Document backup and recovery procedures
# Setup on-call rotation if needed
```

## Self-Hosted Cloud Hosting Explained

### What is Self-Hosted Cloud Hosting?

Self-hosted cloud hosting refers to running cloud-native applications and services on your own infrastructure rather than using third-party cloud providers like AWS, Google Cloud, or Azure. This approach gives you complete control over your data, infrastructure, and costs.

### Key Components of Self-Hosted Cloud

#### 1. Infrastructure Layer

- **Physical/Virtual Servers**: Your own VPS, dedicated servers, or on-premises hardware
- **Operating System**: Linux distributions optimized for server workloads
- **Container Runtime**: Docker for application containerization
- **Orchestration**: Docker Compose for service coordination

#### 2. Platform Layer

- **Load Balancing**: Traefik for routing and SSL termination
- **Service Discovery**: Internal networking between containers
- **Configuration Management**: Environment variables and config files
- **Secrets Management**: Vault for secure credential storage

#### 3. Application Layer

- **Microservices**: Independently deployable services
- **APIs**: RESTful and WebSocket endpoints
- **Databases**: PostgreSQL with extensions
- **Storage**: MinIO for object storage
- **Caching**: Redis for performance optimization

#### 4. Observability Layer

- **Monitoring**: Prometheus for metrics collection
- **Visualization**: Grafana for dashboards
- **Alerting**: Alertmanager for notifications
- **Logging**: Centralized log aggregation

### Advantages of Self-Hosted Cloud

#### 1. Data Sovereignty

- Complete control over your data
- No third-party access to sensitive information
- Compliance with data protection regulations
- Customizable data retention policies

#### 2. Cost Control

- Predictable infrastructure costs
- No vendor lock-in fees
- Pay only for what you use
- Scale on your own terms

#### 3. Customization

- Tailored infrastructure to your needs
- Custom security policies
- Flexible deployment strategies
- Integration with existing systems

#### 4. Performance

- Optimized for your specific workload
- Reduced latency through geographic placement
- Custom caching strategies
- Direct hardware access

### Challenges and Solutions

#### 1. Infrastructure Management

**Challenge**: Managing servers, updates, and maintenance

**Solution**:

- Use configuration management tools
- Implement automated updates
- Monitor system health continuously
- Plan for redundancy and failover

#### 2. Scalability

**Challenge**: Handling traffic spikes and growth

**Solution**:

- Implement horizontal scaling with load balancers
- Use container orchestration for auto-scaling
- Optimize database performance
- Implement caching strategies

#### 3. Security

**Challenge**: Protecting against threats and vulnerabilities

**Solution**:

- Regular security updates
- Network segmentation
- Intrusion detection systems
- Regular security audits

#### 4. Backup and Recovery

**Challenge**: Ensuring data durability and quick recovery

**Solution**:

- Automated backup schedules
- Off-site backup storage
- Regular recovery testing
- Disaster recovery planning

### Networking and Security Considerations

#### 1. Network Architecture

```text
Internet
    ↓
[Firewall/Router]
    ↓
[Traefik Reverse Proxy]
    ↓
[Internal Docker Network]
    ↓
[Application Services]
    ↓
[Database & Storage]
```

#### 2. Security Best Practices

- **Network Segmentation**: Isolate services using Docker networks
- **SSL/TLS**: Encrypt all external communications
- **Access Control**: Implement role-based access control
- **Monitoring**: Log all access and suspicious activities
- **Updates**: Regularly update all components
- **Backups**: Encrypt and store backups securely

#### 3. High Availability

- **Load Balancing**: Distribute traffic across multiple instances
- **Database Replication**: Ensure data availability
- **Service Redundancy**: Run critical services in multiple containers
- **Automated Failover**: Implement health checks and auto-restart

### Cost Comparison

#### Traditional Cloud Hosting (AWS)

- **Compute**: $0.096/hour per t3.medium instance
- **Storage**: $0.023/GB/month for S3
- **Database**: $0.017/hour for RDS t3.micro
- **Load Balancer**: $0.0225/hour
- **Monitoring**: Additional CloudWatch costs
- **Data Transfer**: $0.09/GB outbound

#### Self-Hosted VPS (Example: DigitalOcean)

- **VPS**: $48/month (4GB RAM, 2 vCPUs, 80GB SSD)
- **Backup Storage**: $5/month (50GB)
- **Domain/SSL**: $15/year
- **Total Monthly Cost**: ~$53/month

**Savings**: Approximately 70-80% cost reduction for typical workloads

### Scaling Strategies

#### 1. Vertical Scaling

- Increase server resources (CPU, RAM, storage)
- Suitable for moderate growth
- Simpler to implement

#### 2. Horizontal Scaling

- Add more servers
- Implement load balancing
- More complex but highly scalable

#### 3. Service-Level Scaling

- Scale individual services independently
- Use container orchestration
- Optimize resource utilization

### Monitoring and Maintenance

#### 1. Key Metrics to Monitor

- **System Resources**: CPU, memory, disk usage
- **Application Performance**: Response times, error rates
- **Database Performance**: Query latency, connection count
- **Network Traffic**: Bandwidth usage, connection count
- **Service Health**: Uptime, health check status

#### 2. Maintenance Tasks

- **Daily**: Check system logs, monitor alerts
- **Weekly**: Review performance metrics, update packages
- **Monthly**: Security updates, backup verification
- **Quarterly**: Infrastructure review, capacity planning

### Migration from Cloud to Self-Hosted

#### 1. Assessment Phase

- Analyze current cloud usage and costs
- Identify data transfer requirements
- Plan migration timeline
- Setup self-hosted infrastructure

#### 2. Data Migration

- Export data from cloud services
- Transfer to self-hosted storage
- Update application configurations
- Test data integrity

#### 3. Service Migration

- Deploy self-hosted alternatives
- Update DNS records
- Test functionality
- Monitor performance

#### 4. Optimization Phase

- Tune performance settings
- Optimize costs
- Implement monitoring
- Document procedures

### Conclusion

Self-hosted cloud hosting provides a compelling alternative to traditional cloud providers, offering greater control, cost savings, and customization options. While it requires more hands-on management, the benefits of data sovereignty and cost control make it an excellent choice for applications that need to maintain complete control over their infrastructure and data.

The Sav3 dating app is designed to run efficiently in a self-hosted environment, with all necessary services and configurations included in the Docker Compose setup. Following this guide will result in a production-ready, fully self-hosted deployment that meets enterprise-grade requirements for security, performance, and reliability.
