#!/bin/bash

# Secure PostgreSQL SSL Certificate Generation
# Creates self-signed certificates for PostgreSQL SSL connections

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../postgres/ssl-certs"

# Create certificate directory
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

echo "=== Generating PostgreSQL SSL Certificates ==="

# Certificate configuration
CERT_DOMAIN="${CERT_DOMAIN:-localhost}"
CERT_EMAIL="${CERT_EMAIL:-admin@localhost}"
CERT_ORGANIZATION="${CERT_ORGANIZATION:-SAV3}"
CERT_COUNTRY="${CERT_COUNTRY:-US}"
CERT_STATE="${CERT_STATE:-CA}"
CERT_CITY="${CERT_CITY:-San Francisco}"

# Generate CA private key
if [ ! -f ca.key ]; then
    echo "Generating CA private key..."
    openssl genrsa -out ca.key 4096
    chmod 600 ca.key
fi

# Generate CA certificate
if [ ! -f ca.crt ]; then
    echo "Generating CA certificate..."
    openssl req -new -x509 -key ca.key -sha256 -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_CITY/O=$CERT_ORGANIZATION/CN=PostgreSQL CA" -days 3650 -out ca.crt
fi

# Generate server private key
if [ ! -f server.key ]; then
    echo "Generating server private key..."
    openssl genrsa -out server.key 4096
    chmod 600 server.key
fi

# Generate server certificate signing request
if [ ! -f server.csr ]; then
    echo "Generating server certificate signing request..."
    openssl req -new -key server.key -out server.csr -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_CITY/O=$CERT_ORGANIZATION/CN=$CERT_DOMAIN"
fi

# Generate server certificate
if [ ! -f server.crt ]; then
    echo "Generating server certificate..."

    # Create extensions file for server certificate
    cat > server_cert_ext.cnf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = postgres-primary-secure
DNS.3 = postgres-replica-secure
DNS.4 = pgbouncer-secure
DNS.5 = $CERT_DOMAIN
IP.1 = 127.0.0.1
IP.2 = 172.20.0.2
IP.3 = 172.20.0.3
EOF

    openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365 -extensions v3_req -extfile server_cert_ext.cnf
    rm server_cert_ext.cnf
fi

# Generate client private key
if [ ! -f client.key ]; then
    echo "Generating client private key..."
    openssl genrsa -out client.key 4096
    chmod 600 client.key
fi

# Generate client certificate signing request
if [ ! -f client.csr ]; then
    echo "Generating client certificate signing request..."
    openssl req -new -key client.key -out client.csr -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_CITY/O=$CERT_ORGANIZATION/CN=PostgreSQL Client"
fi

# Generate client certificate
if [ ! -f client.crt ]; then
    echo "Generating client certificate..."
    openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365
fi

# Set appropriate permissions
chmod 644 ca.crt server.crt client.crt
chmod 600 ca.key server.key client.key

# Clean up CSR files
rm -f server.csr client.csr

echo "=== SSL Certificate Generation Complete ==="
echo "Generated certificates:"
echo "  CA Certificate: ca.crt"
echo "  Server Certificate: server.crt"
echo "  Server Private Key: server.key"
echo "  Client Certificate: client.crt"
echo "  Client Private Key: client.key"
echo
echo "Certificate files are located in: $CERT_DIR"
echo
echo "To verify certificates:"
echo "  openssl x509 -in server.crt -text -noout"
echo "  openssl verify -CAfile ca.crt server.crt"
echo
echo "Note: These are self-signed certificates for development/testing."
echo "For production, use certificates from a trusted CA or Let's Encrypt."
