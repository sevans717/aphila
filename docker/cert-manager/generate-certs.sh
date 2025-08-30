#!/bin/bash

# Certificate Manager for PostgreSQL SSL
# Generates and manages SSL certificates for PostgreSQL

set -e

CERT_DIR="/certs"
DOMAIN="${CERT_DOMAIN:-localhost}"
EMAIL="${CERT_EMAIL:-admin@localhost}"

echo "=== Certificate Manager Starting ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Certificate Directory: $CERT_DIR"

# Create certificate directory
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# Function to generate self-signed certificates
generate_self_signed() {
    echo "Generating self-signed certificates..."

    # CA Key and Certificate
    if [ ! -f ca.key ]; then
        openssl genrsa -out ca.key 4096
        chmod 600 ca.key
    fi

    if [ ! -f ca.crt ]; then
        openssl req -new -x509 -key ca.key -sha256 \
            -subj "/C=US/ST=CA/L=San Francisco/O=SAV3/CN=PostgreSQL CA" \
            -days 3650 -out ca.crt
    fi

    # Server Key
    if [ ! -f server.key ]; then
        openssl genrsa -out server.key 4096
        chmod 600 server.key
    fi

    # Server Certificate
    if [ ! -f server.crt ]; then
        # Create config for SAN
        cat > server.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=US
ST=CA
L=San Francisco
O=SAV3
CN=$DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = postgres-primary-secure
DNS.3 = postgres-replica-secure
DNS.4 = pgbouncer-secure
DNS.5 = $DOMAIN
IP.1 = 127.0.0.1
IP.2 = 172.20.0.2
IP.3 = 172.20.0.3
EOF

        openssl req -new -key server.key -out server.csr -config server.conf
        openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
            -CAcreateserial -out server.crt -days 365 \
            -extensions v3_req -extfile server.conf
        rm server.csr server.conf
    fi

    # Client Key and Certificate
    if [ ! -f client.key ]; then
        openssl genrsa -out client.key 4096
        chmod 600 client.key
    fi

    if [ ! -f client.crt ]; then
        openssl req -new -key client.key -out client.csr \
            -subj "/C=US/ST=CA/L=San Francisco/O=SAV3/CN=PostgreSQL Client"
        openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key \
            -CAcreateserial -out client.crt -days 365
        rm client.csr
    fi

    # Set permissions
    chmod 644 ca.crt server.crt client.crt
    chmod 600 ca.key server.key client.key

    echo "Self-signed certificates generated successfully"
}

# Function to check certificate expiration
check_expiration() {
    if [ -f server.crt ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in server.crt | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

        echo "Certificate expires in $days_until_expiry days"

        if [ $days_until_expiry -lt 30 ]; then
            echo "Certificate expires soon, regenerating..."
            rm -f server.crt client.crt
            generate_self_signed
        fi
    fi
}

# Function to validate certificates
validate_certificates() {
    echo "Validating certificates..."

    if openssl verify -CAfile ca.crt server.crt > /dev/null 2>&1; then
        echo "✓ Server certificate is valid"
    else
        echo "✗ Server certificate is invalid"
        return 1
    fi

    if openssl verify -CAfile ca.crt client.crt > /dev/null 2>&1; then
        echo "✓ Client certificate is valid"
    else
        echo "✗ Client certificate is invalid"
        return 1
    fi

    echo "All certificates are valid"
}

# Main execution
main() {
    echo "Starting certificate management..."

    # Check if certificates exist
    if [ ! -f server.crt ] || [ ! -f client.crt ]; then
        generate_self_signed
    else
        check_expiration
    fi

    validate_certificates

    echo "=== Certificate Management Complete ==="
    echo "Certificates available:"
    ls -la "$CERT_DIR"/*.crt "$CERT_DIR"/*.key 2>/dev/null || true

    # If running as daemon, sleep
    if [ "${1:-}" = "daemon" ]; then
        echo "Running as daemon, checking certificates every 24 hours..."
        while true; do
            sleep 86400  # 24 hours
            check_expiration
        done
    fi
}

# Run main function
main "$@"
