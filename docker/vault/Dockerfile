# HashiCorp Vault Dockerfile
# Provides a secure, containerized Vault instance with proper configuration

FROM vault:1.15

# Install additional utilities
RUN apk add --no-cache \
    jq \
    curl \
    bash \
    openssl

# Create vault user and directories
RUN addgroup -g 1001 vault-group && \
    adduser -D -u 1001 -G vault-group vault-user

# Create necessary directories
RUN mkdir -p /vault/data \
    /vault/logs \
    /vault/config \
    /vault/file \
    /tmp/vault

# Copy configuration
COPY vault.hcl /vault/config/vault.hcl
COPY vault-entrypoint.sh /usr/local/bin/vault-entrypoint.sh

# Set permissions
RUN chown -R vault-user:vault-group /vault /tmp/vault && \
    chmod +x /usr/local/bin/vault-entrypoint.sh && \
    chmod 600 /vault/config/vault.hcl

# Switch to vault user
USER vault-user

# Expose Vault port
EXPOSE 8200

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
CMD ["vault", "server", "-config=/vault/config/vault.hcl"]
