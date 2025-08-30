#!/bin/bash
set -e

# HashiCorp Vault Secrets Management Setup
# This script initializes Vault, configures policies, and rotates database credentials

VAULT_ADDR=${VAULT_ADDR:-"http://vault:8200"}
VAULT_TOKEN_FILE="/tmp/vault-init-keys.json"
DB_SECRETS_PATH="kv/database"
API_SECRETS_PATH="kv/api"

echo "[VAULT] Starting Vault secrets management setup..."

# Wait for Vault to be ready
wait_for_vault() {
    echo "[VAULT] Waiting for Vault to be ready..."
    while ! vault status &>/dev/null; do
        echo "[VAULT] Vault not ready, waiting..."
        sleep 2
    done
    echo "[VAULT] Vault is ready"
}

# Initialize Vault if not already initialized
init_vault() {
    if vault status | grep -q "Initialized.*true"; then
        echo "[VAULT] Vault already initialized"
        return 0
    fi

    echo "[VAULT] Initializing Vault..."
    vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -format=json > "${VAULT_TOKEN_FILE}"

    # Extract and use root token
    ROOT_TOKEN=$(jq -r '.root_token' "${VAULT_TOKEN_FILE}")
    export VAULT_TOKEN="${ROOT_TOKEN}"

    # Unseal Vault
    UNSEAL_KEY_1=$(jq -r '.unseal_keys_b64[0]' "${VAULT_TOKEN_FILE}")
    UNSEAL_KEY_2=$(jq -r '.unseal_keys_b64[1]' "${VAULT_TOKEN_FILE}")
    UNSEAL_KEY_3=$(jq -r '.unseal_keys_b64[2]' "${VAULT_TOKEN_FILE}")

    vault operator unseal "${UNSEAL_KEY_1}"
    vault operator unseal "${UNSEAL_KEY_2}"
    vault operator unseal "${UNSEAL_KEY_3}"

    echo "[VAULT] Vault initialized and unsealed"
}

# Enable KV secrets engine
enable_kv_engine() {
    if vault secrets list | grep -q "kv/"; then
        echo "[VAULT] KV engine already enabled"
        return 0
    fi

    echo "[VAULT] Enabling KV v2 secrets engine..."
    vault secrets enable -version=2 kv
}

# Create database secrets policy
create_db_policy() {
    echo "[VAULT] Creating database secrets policy..."
    vault policy write database-secrets - <<EOF
# Database secrets policy
path "kv/data/database/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/database/*" {
  capabilities = ["list"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF
}

# Create API secrets policy
create_api_policy() {
    echo "[VAULT] Creating API secrets policy..."
    vault policy write api-secrets - <<EOF
# API secrets policy
path "kv/data/api/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/api/*" {
  capabilities = ["list"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF
}

# Generate and store database credentials
store_db_secrets() {
    echo "[VAULT] Generating and storing database credentials..."

    # Generate secure passwords
    DB_ADMIN_PASSWORD=$(openssl rand -base64 32)
    DB_APP_PASSWORD=$(openssl rand -base64 32)
    DB_REPLICA_PASSWORD=$(openssl rand -base64 32)
    DB_BACKUP_PASSWORD=$(openssl rand -base64 32)

    # Store in Vault
    vault kv put ${DB_SECRETS_PATH}/admin \
        username="postgres" \
        password="${DB_ADMIN_PASSWORD}" \
        connection_string="postgresql://postgres:${DB_ADMIN_PASSWORD}@postgres-primary-secure:5432/sav3"

    vault kv put ${DB_SECRETS_PATH}/app \
        username="sav3_app" \
        password="${DB_APP_PASSWORD}" \
        connection_string="postgresql://sav3_app:${DB_APP_PASSWORD}@pgbouncer-secure:6432/sav3"

    vault kv put ${DB_SECRETS_PATH}/replica \
        username="replicator" \
        password="${DB_REPLICA_PASSWORD}" \
        connection_string="postgresql://replicator:${DB_REPLICA_PASSWORD}@postgres-replica-secure:5432/sav3"

    vault kv put ${DB_SECRETS_PATH}/backup \
        username="backup_user" \
        password="${DB_BACKUP_PASSWORD}"

    echo "[VAULT] Database credentials stored successfully"
}

# Generate and store API secrets
store_api_secrets() {
    echo "[VAULT] Generating and storing API secrets..."

    # Generate secure secrets
    JWT_ACCESS_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)

    # Store in Vault
    vault kv put ${API_SECRETS_PATH}/jwt \
        access_secret="${JWT_ACCESS_SECRET}" \
        refresh_secret="${JWT_REFRESH_SECRET}" \
        encryption_key="${ENCRYPTION_KEY}" \
        session_secret="${SESSION_SECRET}"

    # Generate Stripe webhook secret
    STRIPE_WEBHOOK_SECRET=$(openssl rand -base64 32)
    vault kv put ${API_SECRETS_PATH}/stripe \
        webhook_secret="${STRIPE_WEBHOOK_SECRET}"

    echo "[VAULT] API secrets stored successfully"
}

# Create application tokens
create_app_tokens() {
    echo "[VAULT] Creating application tokens..."

    # Create token for database access
    DB_TOKEN=$(vault token create \
        -policy=database-secrets \
        -ttl=24h \
        -renewable=true \
        -format=json | jq -r '.auth.client_token')

    # Create token for API access
    API_TOKEN=$(vault token create \
        -policy=api-secrets \
        -ttl=24h \
        -renewable=true \
        -format=json | jq -r '.auth.client_token')

    # Store tokens for application use
    echo "VAULT_DB_TOKEN=${DB_TOKEN}" > /tmp/vault-tokens.env
    echo "VAULT_API_TOKEN=${API_TOKEN}" >> /tmp/vault-tokens.env

    echo "[VAULT] Application tokens created and saved to /tmp/vault-tokens.env"
}

# Rotate database passwords
rotate_db_passwords() {
    echo "[VAULT] Rotating database passwords..."

    # Generate new passwords
    NEW_APP_PASSWORD=$(openssl rand -base64 32)
    NEW_REPLICA_PASSWORD=$(openssl rand -base64 32)
    NEW_BACKUP_PASSWORD=$(openssl rand -base64 32)

    # Update in database first
    export PGPASSWORD=$(vault kv get -field=password ${DB_SECRETS_PATH}/admin)
    psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER sav3_app PASSWORD '${NEW_APP_PASSWORD}';"
    psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER replicator PASSWORD '${NEW_REPLICA_PASSWORD}';"
    psql -h postgres-primary-secure -U postgres -d sav3 -c "ALTER USER backup_user PASSWORD '${NEW_BACKUP_PASSWORD}';"

    # Update in Vault
    vault kv patch ${DB_SECRETS_PATH}/app password="${NEW_APP_PASSWORD}"
    vault kv patch ${DB_SECRETS_PATH}/replica password="${NEW_REPLICA_PASSWORD}"
    vault kv patch ${DB_SECRETS_PATH}/backup password="${NEW_BACKUP_PASSWORD}"

    # Update connection strings
    vault kv patch ${DB_SECRETS_PATH}/app \
        connection_string="postgresql://sav3_app:${NEW_APP_PASSWORD}@pgbouncer-secure:6432/sav3"
    vault kv patch ${DB_SECRETS_PATH}/replica \
        connection_string="postgresql://replicator:${NEW_REPLICA_PASSWORD}@postgres-replica-secure:5432/sav3"

    echo "[VAULT] Database passwords rotated successfully"
}

# Main execution
main() {
    case "${1:-setup}" in
        "setup")
            wait_for_vault
            init_vault
            enable_kv_engine
            create_db_policy
            create_api_policy
            store_db_secrets
            store_api_secrets
            create_app_tokens
            echo "[VAULT] Setup completed successfully"
            ;;
        "rotate")
            wait_for_vault
            rotate_db_passwords
            echo "[VAULT] Password rotation completed"
            ;;
        "unseal")
            if [ ! -f "${VAULT_TOKEN_FILE}" ]; then
                echo "[VAULT] ERROR: No init keys file found"
                exit 1
            fi

            UNSEAL_KEY_1=$(jq -r '.unseal_keys_b64[0]' "${VAULT_TOKEN_FILE}")
            UNSEAL_KEY_2=$(jq -r '.unseal_keys_b64[1]' "${VAULT_TOKEN_FILE}")
            UNSEAL_KEY_3=$(jq -r '.unseal_keys_b64[2]' "${VAULT_TOKEN_FILE}")

            vault operator unseal "${UNSEAL_KEY_1}"
            vault operator unseal "${UNSEAL_KEY_2}"
            vault operator unseal "${UNSEAL_KEY_3}"
            echo "[VAULT] Vault unsealed successfully"
            ;;
        *)
            echo "Usage: $0 {setup|rotate|unseal}"
            echo "  setup  - Initialize Vault and create secrets"
            echo "  rotate - Rotate database passwords"
            echo "  unseal - Unseal Vault using stored keys"
            exit 1
            ;;
    esac
}

main "$@"
