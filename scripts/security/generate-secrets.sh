#!/bin/bash

# Secure Secrets Generation Script
# Generates secure random passwords and secrets for the SAV3 application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_DIR="$SCRIPT_DIR/../../secrets"

# Create secrets directory
mkdir -p "$SECRETS_DIR"
cd "$SECRETS_DIR"

echo "=== Generating Secure Secrets ==="

# Function to generate secure random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate cryptographically secure key
generate_key() {
    local length=${1:-64}
    openssl rand -hex $length
}

# Generate PostgreSQL passwords
if [ ! -f postgres_password.txt ]; then
    echo "Generating PostgreSQL admin password..."
    generate_password 24 > postgres_password.txt
    chmod 600 postgres_password.txt
fi

if [ ! -f replication_password.txt ]; then
    echo "Generating replication user password..."
    generate_password 24 > replication_password.txt
    chmod 600 replication_password.txt
fi

if [ ! -f sav3_app_password.txt ]; then
    echo "Generating application user password..."
    generate_password 32 > sav3_app_password.txt
    chmod 600 sav3_app_password.txt
fi

if [ ! -f sav3_readonly_password.txt ]; then
    echo "Generating read-only user password..."
    generate_password 24 > sav3_readonly_password.txt
    chmod 600 sav3_readonly_password.txt
fi

if [ ! -f sav3_backup_password.txt ]; then
    echo "Generating backup user password..."
    generate_password 24 > sav3_backup_password.txt
    chmod 600 sav3_backup_password.txt
fi

# Generate application secrets
if [ ! -f jwt_access_secret.txt ]; then
    echo "Generating JWT access token secret..."
    generate_key 32 > jwt_access_secret.txt
    chmod 600 jwt_access_secret.txt
fi

if [ ! -f jwt_refresh_secret.txt ]; then
    echo "Generating JWT refresh token secret..."
    generate_key 32 > jwt_refresh_secret.txt
    chmod 600 jwt_refresh_secret.txt
fi

if [ ! -f encryption_key.txt ]; then
    echo "Generating encryption key..."
    generate_key 32 > encryption_key.txt
    chmod 600 encryption_key.txt
fi

if [ ! -f session_secret.txt ]; then
    echo "Generating session secret..."
    generate_key 32 > session_secret.txt
    chmod 600 session_secret.txt
fi

# Generate Vault token
if [ ! -f vault_root_token.txt ]; then
    echo "Generating Vault root token..."
    generate_password 36 > vault_root_token.txt
    chmod 600 vault_root_token.txt
fi

# Generate PgBouncer auth key
if [ ! -f pgbouncer_auth_key.txt ]; then
    echo "Generating PgBouncer auth key..."
    generate_key 32 > pgbouncer_auth_key.txt
    chmod 600 pgbouncer_auth_key.txt
fi

# Generate monitoring password
if [ ! -f monitoring_password.txt ]; then
    echo "Generating monitoring password..."
    generate_password 24 > monitoring_password.txt
    chmod 600 monitoring_password.txt
fi

# Create .env.secrets template
cat > .env.secrets.template << 'EOF'
# Generated Secure Secrets
# Copy to .env.secrets and source in your main .env file

# PostgreSQL Configuration
POSTGRES_PASSWORD=<generated_password>
POSTGRES_REPLICATION_PASSWORD=<generated_password>
SAV3_APP_PASSWORD=<generated_password>
SAV3_READONLY_PASSWORD=<generated_password>
SAV3_BACKUP_PASSWORD=<generated_password>

# Application Secrets
JWT_ACCESS_SECRET=<generated_key>
JWT_REFRESH_SECRET=<generated_key>
ENCRYPTION_KEY=<generated_key>
SESSION_SECRET=<generated_key>

# Infrastructure Secrets
VAULT_ROOT_TOKEN=<generated_token>
PGBOUNCER_AUTH_KEY=<generated_key>
MONITORING_PASSWORD=<generated_password>

# Database URLs (construct with generated passwords)
DATABASE_URL=postgresql://sav3_app:<sav3_app_password>@localhost:5432/sav3?sslmode=require
DATABASE_READONLY_URL=postgresql://sav3_readonly:<readonly_password>@localhost:5432/sav3?sslmode=require
EOF

# Create actual .env.secrets with generated values
echo "Creating .env.secrets file..."
cat > .env.secrets << EOF
# Generated Secure Secrets
# Generated on: $(date)

# PostgreSQL Configuration
POSTGRES_PASSWORD=$(cat postgres_password.txt)
POSTGRES_REPLICATION_PASSWORD=$(cat replication_password.txt)
SAV3_APP_PASSWORD=$(cat sav3_app_password.txt)
SAV3_READONLY_PASSWORD=$(cat sav3_readonly_password.txt)
SAV3_BACKUP_PASSWORD=$(cat sav3_backup_password.txt)

# Application Secrets
JWT_ACCESS_SECRET=$(cat jwt_access_secret.txt)
JWT_REFRESH_SECRET=$(cat jwt_refresh_secret.txt)
ENCRYPTION_KEY=$(cat encryption_key.txt)
SESSION_SECRET=$(cat session_secret.txt)

# Infrastructure Secrets
VAULT_ROOT_TOKEN=$(cat vault_root_token.txt)
PGBOUNCER_AUTH_KEY=$(cat pgbouncer_auth_key.txt)
MONITORING_PASSWORD=$(cat monitoring_password.txt)

# Database URLs (using generated passwords)
DATABASE_URL=postgresql://sav3_app:$(cat sav3_app_password.txt)@localhost:5432/sav3?sslmode=require
DATABASE_READONLY_URL=postgresql://sav3_readonly:$(cat sav3_readonly_password.txt)@localhost:5432/sav3?sslmode=require
EOF

chmod 600 .env.secrets

echo "=== Secret Generation Complete ==="
echo "Generated secrets:"
echo "  PostgreSQL Admin: postgres_password.txt"
echo "  Replication User: replication_password.txt"
echo "  Application User: sav3_app_password.txt"
echo "  Read-only User: sav3_readonly_password.txt"
echo "  Backup User: sav3_backup_password.txt"
echo "  JWT Access Secret: jwt_access_secret.txt"
echo "  JWT Refresh Secret: jwt_refresh_secret.txt"
echo "  Encryption Key: encryption_key.txt"
echo "  Session Secret: session_secret.txt"
echo "  Vault Root Token: vault_root_token.txt"
echo "  PgBouncer Auth Key: pgbouncer_auth_key.txt"
echo "  Monitoring Password: monitoring_password.txt"
echo
echo "Environment file: .env.secrets"
echo
echo "IMPORTANT SECURITY NOTES:"
echo "1. Store these secrets securely and never commit them to version control"
echo "2. Use a proper secrets management system in production"
echo "3. Rotate secrets regularly"
echo "4. Limit access to secrets on a need-to-know basis"
echo "5. Consider using HashiCorp Vault or similar for production secrets"
echo
echo "To use these secrets, add to your main .env file:"
echo 'source ./secrets/.env.secrets'
