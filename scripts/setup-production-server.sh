#!/bin/bash
# ===========================================
# SAV3 PRODUCTION SERVER SETUP SCRIPT
# ===========================================
# Automated setup for aphila.io production deployment
# Generated: August 29, 2025

set -e  # Exit on any error

echo "🚀 Starting Sav3 Production Server Setup for aphila.io"
echo "=================================================="

# ===========================================
# PHASE 1: SYSTEM PREPARATION
# ===========================================
echo "📋 Phase 1: System Preparation"

# Update system packages
echo "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# ===========================================
# PHASE 2: DOCKER INSTALLATION
# ===========================================
echo "🐳 Phase 2: Docker Installation"

# Remove any existing Docker installations
sudo apt remove -y docker docker-engine docker.io containerd runc || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

echo "✅ Docker installed successfully"

# ===========================================
# PHASE 3: FIREWALL CONFIGURATION
# ===========================================
echo "🔥 Phase 3: Firewall Configuration"

# Enable UFW firewall
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (port 22)
sudo ufw allow ssh
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific application ports
sudo ufw allow 10010/tcp  # API server (development)
sudo ufw allow 10000/tcp  # PostgreSQL (development)
sudo ufw allow 10030/tcp  # MinIO API
sudo ufw allow 10031/tcp  # MinIO Console
sudo ufw allow 10033/tcp  # Redis
sudo ufw allow 8200/tcp   # Vault
sudo ufw allow 3000/tcp   # Grafana
sudo ufw allow 9090/tcp   # Prometheus

# Enable firewall
sudo ufw --force enable

echo "✅ Firewall configured successfully"

# ===========================================
# PHASE 4: FAIL2BAN CONFIGURATION
# ===========================================
echo "🛡️ Phase 4: Fail2Ban Configuration"

# Install and configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create custom jail configuration
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl restart fail2ban

echo "✅ Fail2Ban configured successfully"

# ===========================================
# PHASE 5: SSL CERTIFICATE PREPARATION
# ===========================================
echo "🔐 Phase 5: SSL Certificate Preparation"

# Install certbot for Let's Encrypt
sudo apt install -y certbot

# Create directories for SSL certificates
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/letsencrypt/live/aphila.io

echo "✅ SSL preparation completed"

# ===========================================
# PHASE 6: DOMAIN VERIFICATION
# ===========================================
echo "🌐 Phase 6: Domain Verification"

echo "Checking DNS configuration for aphila.io subdomains..."

# Check main domains
domains=(
    "aphila.io"
    "api.aphila.io"
    "minio.aphila.io"
    "vault.aphila.io"
    "grafana.aphila.io"
    "traefik.aphila.io"
)

for domain in "${domains[@]}"; do
    echo "Checking $domain..."
    if nslookup $domain > /dev/null 2>&1; then
        echo "✅ $domain resolves correctly"
    else
        echo "⚠️  $domain does not resolve - please configure DNS"
    fi
done

# ===========================================
# PHASE 7: DIRECTORY STRUCTURE SETUP
# ===========================================
echo "📁 Phase 7: Directory Structure Setup"

# Create application directories
sudo mkdir -p /opt/sav3-production
sudo mkdir -p /opt/sav3-production/data
sudo mkdir -p /opt/sav3-production/logs
sudo mkdir -p /opt/sav3-production/backups
sudo mkdir -p /opt/sav3-production/ssl

# Set proper permissions
sudo chown -R $USER:$USER /opt/sav3-production

echo "✅ Directory structure created"

# ===========================================
# PHASE 8: SYSTEM OPTIMIZATION
# ===========================================
echo "⚡ Phase 8: System Optimization"

# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters for PostgreSQL
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# PostgreSQL optimizations
kernel.shmmax = 268435456
kernel.shmall = 2097152
kernel.shmmni = 4096
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
net.ipv4.tcp_keepalive_time = 120
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
EOF

# Apply kernel parameters
sudo sysctl -p

echo "✅ System optimization completed"

# ===========================================
# PHASE 9: LOG ROTATION SETUP
# ===========================================
echo "📊 Phase 9: Log Rotation Setup"

# Configure log rotation for application logs
sudo tee /etc/logrotate.d/sav3 > /dev/null <<EOF
/opt/sav3-production/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        docker-compose -f /opt/sav3-production/docker-compose.yml restart api > /dev/null 2>&1 || true
    endscript
}
EOF

echo "✅ Log rotation configured"

# ===========================================
# PHASE 10: MONITORING SETUP
# ===========================================
echo "📈 Phase 10: Basic Monitoring Setup"

# Install htop and iotop for system monitoring
sudo apt install -y htop iotop nethogs

# Create basic system monitoring script
tee /opt/sav3-production/system-monitor.sh > /dev/null <<EOF
#!/bin/bash
# Basic system monitoring script

echo "=== System Status Report ==="
echo "Date: \$(date)"
echo "Uptime: \$(uptime)"
echo "Disk Usage:"
df -h
echo "Memory Usage:"
free -h
echo "Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "==========================="
EOF

chmod +x /opt/sav3-production/system-monitor.sh

echo "✅ Basic monitoring setup completed"

# ===========================================
# PHASE 11: BACKUP DIRECTORY SETUP
# ===========================================
echo "💾 Phase 11: Backup Directory Setup"

# Create backup directories
mkdir -p /opt/sav3-production/backups/database
mkdir -p /opt/sav3-production/backups/minio
mkdir -p /opt/sav3-production/backups/redis

# Create backup script template
tee /opt/sav3-production/backup-script.sh > /dev/null <<EOF
#!/bin/bash
# Automated backup script for Sav3 production

BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/sav3-production/backups"

echo "Starting backup at \$BACKUP_DATE"

# Database backup
docker-compose -f /opt/sav3-production/docker-compose.yml exec -T db pg_dump -U postgres sav3 | gzip > "\$BACKUP_DIR/database/sav3_\$BACKUP_DATE.sql.gz"

# MinIO data backup
docker-compose -f /opt/sav3-production/docker-compose.yml exec -T minio mc mirror local/sav3-media-prod "\$BACKUP_DIR/minio/\$BACKUP_DATE/"

echo "Backup completed at \$(date)"
EOF

chmod +x /opt/sav3-production/backup-script.sh

echo "✅ Backup directory setup completed"

# ===========================================
# FINAL PHASE: VERIFICATION
# ===========================================
echo "🔍 Final Phase: System Verification"

# Check Docker installation
docker --version
docker compose version

# Check firewall status
sudo ufw status

# Check fail2ban status
sudo fail2ban-client status

# Display system information
echo "📊 System Information:"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "Disk Space: $(df -h / | tail -1 | awk '{print $4}') available"
echo "Docker: $(docker --version)"

# ===========================================
# COMPLETION SUMMARY
# ===========================================
echo ""
echo "🎉 SERVER SETUP COMPLETED SUCCESSFULLY!"
echo "======================================"
echo ""
echo "✅ System updated and optimized"
echo "✅ Docker and Docker Compose installed"
echo "✅ Firewall configured (UFW + Fail2Ban)"
echo "✅ SSL certificate preparation completed"
echo "✅ Domain verification performed"
echo "✅ Directory structure created"
echo "✅ Log rotation configured"
echo "✅ Basic monitoring setup"
echo "✅ Backup directories prepared"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure DNS records for all aphila.io subdomains"
echo "2. Run Phase 2: Service Deployment"
echo "3. Generate SSL certificates via Traefik"
echo "4. Deploy and test all services"
echo ""
echo "📝 Important Notes:"
echo "- Please log out and log back in for Docker group permissions"
echo "- Configure your DNS records to point to this server's IP"
echo "- Update firewall rules if you change service ports"
echo ""
echo "🚀 Ready for Phase 2: Service Deployment!"
