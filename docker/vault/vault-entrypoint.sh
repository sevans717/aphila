#!/bin/bash
set -e

# Vault Entrypoint Script
# Handles initialization, unsealing, and startup of Vault

VAULT_DATA_DIR="/vault/file"
VAULT_INIT_FILE="/tmp/vault/init-keys.json"

# Wait for SSL certificates
wait_for_certs() {
    echo "Waiting for SSL certificates..."
    while [ ! -f "/etc/ssl/certs/server.crt" ] || [ ! -f "/etc/ssl/certs/server.key" ]; do
        echo "SSL certificates not ready, waiting..."
        sleep 2
    done
    echo "SSL certificates found"
}

# Initialize Vault if not already initialized
init_vault_if_needed() {
    # Wait a bit for Vault to start
    sleep 5

    # Check if Vault is already initialized
    if vault status 2>/dev/null | grep -q "Initialized.*true"; then
        echo "Vault is already initialized"
        return 0
    fi

    echo "Initializing Vault..."
    vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -format=json > "${VAULT_INIT_FILE}"

    if [ $? -eq 0 ]; then
        echo "Vault initialized successfully"
        echo "Init keys saved to: ${VAULT_INIT_FILE}"

        # Make init file readable by vault user only
        chmod 600 "${VAULT_INIT_FILE}"
    else
        echo "Failed to initialize Vault"
        return 1
    fi
}

# Auto-unseal Vault using stored keys
auto_unseal() {
    if [ ! -f "${VAULT_INIT_FILE}" ]; then
        echo "No init keys file found, skipping auto-unseal"
        return 0
    fi

    echo "Attempting to unseal Vault..."

    # Extract unseal keys
    local unseal_key_1=$(jq -r '.unseal_keys_b64[0]' "${VAULT_INIT_FILE}")
    local unseal_key_2=$(jq -r '.unseal_keys_b64[1]' "${VAULT_INIT_FILE}")
    local unseal_key_3=$(jq -r '.unseal_keys_b64[2]' "${VAULT_INIT_FILE}")

    # Unseal Vault
    vault operator unseal "${unseal_key_1}"
    vault operator unseal "${unseal_key_2}"
    vault operator unseal "${unseal_key_3}"

    if vault status | grep -q "Sealed.*false"; then
        echo "Vault unsealed successfully"
        return 0
    else
        echo "Failed to unseal Vault"
        return 1
    fi
}

# Background initialization and unsealing
background_init() {
    (
        # Wait for Vault server to be ready
        while ! vault status &>/dev/null; do
            echo "Waiting for Vault server to be ready..."
            sleep 2
        done

        # Initialize if needed
        init_vault_if_needed

        # Auto-unseal
        auto_unseal

        echo "Vault initialization and unsealing completed"
    ) &
}

# Main entrypoint logic
main() {
    echo "Starting Vault entrypoint..."

    # Ensure data directory exists and has correct permissions
    mkdir -p "${VAULT_DATA_DIR}"
    mkdir -p "$(dirname "${VAULT_INIT_FILE}")"

    # Wait for certificates if TLS is enabled
    wait_for_certs

    # Start background initialization
    background_init

    # Execute the main command
    echo "Starting Vault server..."
    exec "$@"
}

# Handle signals gracefully
trap 'echo "Shutting down Vault..."; kill -TERM $!; wait $!' SIGTERM SIGINT

main "$@"
