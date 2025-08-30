#!/bin/bash
# PgBouncer userlist generator

set -e

USERLIST_FILE="/etc/pgbouncer/userlist.txt"
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
SAV3_USER=${SAV3_USER:-sav3_user}
SAV3_PASSWORD=${SAV3_PASSWORD:-sav3_password}

# Function to generate MD5 hash for pgbouncer
generate_md5_hash() {
    local username=$1
    local password=$2
    echo "md5$(echo -n "${password}${username}" | md5sum | cut -d' ' -f1)"
}

echo "Generating PgBouncer userlist..."

# Create userlist file
cat > "$USERLIST_FILE" << EOF
"$POSTGRES_USER" "$(generate_md5_hash "$POSTGRES_USER" "$POSTGRES_PASSWORD")"
"$SAV3_USER" "$(generate_md5_hash "$SAV3_USER" "$SAV3_PASSWORD")"
EOF

chmod 600 "$USERLIST_FILE"

echo "PgBouncer userlist generated successfully"
