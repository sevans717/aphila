# Vault Configuration
# Production-ready configuration with file storage and TLS

storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = false
  tls_cert_file = "/etc/ssl/certs/server.crt"
  tls_key_file  = "/etc/ssl/certs/server.key"
}

# Disable mlock for containers
disable_mlock = true

# API address
api_addr = "https://vault:8200"

# Cluster address
cluster_addr = "https://vault:8201"

# UI configuration
ui = true

# Log level
log_level = "INFO"

# Log format
log_format = "json"

# Seal configuration (auto-unseal disabled for simplicity)
# In production, consider using cloud auto-unseal
# seal "awskms" {
#   region     = "us-east-1"
#   kms_key_id = "alias/vault-unseal-key"
# }

# Performance and caching
default_lease_ttl = "168h"
max_lease_ttl = "720h"

# Enable raw endpoint (disabled for security)
raw_storage_endpoint = false

# Disable printing of sensitive information
disable_printable_check = true
