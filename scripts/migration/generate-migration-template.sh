#!/bin/bash
set -euo pipefail

# generate-migration-template.sh - Generate migration templates and validate migration structure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default configuration
MIGRATION_NAME=""
MIGRATION_TYPE="safe"
OUTPUT_DIR="$PROJECT_ROOT/migrations"
TEMPLATE_DIR="$SCRIPT_DIR/templates"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <migration-name>

Generate migration templates for the zero-downtime migration system.

Options:
    -t, --type TYPE      Migration type: safe, risky, maintenance (default: safe)
    -o, --output DIR     Output directory (default: $OUTPUT_DIR)
    -h, --help          Show this help message

Migration Types:
    safe        - Safe operations (ADD COLUMN, CREATE INDEX CONCURRENTLY)
    risky       - Risky operations requiring blue-green deployment
    maintenance - Operations requiring planned downtime

Examples:
    $0 add_user_preferences
    $0 --type risky drop_old_table
    $0 --type maintenance major_schema_change
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            MIGRATION_TYPE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            if [[ -z "$MIGRATION_NAME" ]]; then
                MIGRATION_NAME="$1"
            else
                log_error "Unknown option: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$MIGRATION_NAME" ]]; then
    log_error "Migration name is required"
    usage
    exit 1
fi

if [[ ! "$MIGRATION_TYPE" =~ ^(safe|risky|maintenance)$ ]]; then
    log_error "Invalid migration type: $MIGRATION_TYPE"
    exit 1
fi

# Sanitize migration name
MIGRATION_NAME=$(echo "$MIGRATION_NAME" | sed 's/[^a-zA-Z0-9_]/_/g' | tr '[:upper:]' '[:lower:]')

# Generate timestamp and migration filename
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_FILE="${TIMESTAMP}_${MIGRATION_NAME}.sql"
MIGRATION_PATH="$OUTPUT_DIR/$MIGRATION_FILE"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to generate safe migration template
generate_safe_template() {
    cat > "$MIGRATION_PATH" << EOF
-- Migration: $MIGRATION_NAME
-- Type: Safe (No Downtime Required)
-- Generated: $(date)
-- Description: Safe migration that can be executed without downtime

BEGIN;

-- =============================================================================
-- SAFE MIGRATION: $MIGRATION_NAME
-- =============================================================================
-- This migration contains only safe operations that can be executed on the
-- active database without requiring blue-green deployment or downtime.
--
-- Safe operations include:
-- - ADD COLUMN (with DEFAULT values)
-- - CREATE INDEX CONCURRENTLY (use CONCURRENTLY for large tables)
-- - ADD CONSTRAINT (that don't require table scans)
-- - CREATE TABLE (new tables only)
-- - INSERT/UPDATE with small datasets
-- =============================================================================

-- Example: Add new column with default value
-- ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- Example: Create index concurrently (for large tables)
-- CREATE INDEX CONCURRENTLY idx_users_created_at ON users (created_at);

-- Example: Add constraint (ensure it doesn't require table scan)
-- ALTER TABLE users ADD CONSTRAINT users_email_format
--   CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- TODO: Add your migration SQL here
-- Replace the examples above with your actual migration code

-- =============================================================================
-- END SAFE MIGRATION
-- =============================================================================

COMMIT;
EOF
}

# Function to generate risky migration template
generate_risky_template() {
    cat > "$MIGRATION_PATH" << EOF
-- Migration: $MIGRATION_NAME
-- Type: Risky (Blue-Green Deployment Required)
-- Generated: $(date)
-- Description: Risky migration requiring blue-green deployment

BEGIN;

-- =============================================================================
-- RISKY MIGRATION: $MIGRATION_NAME
-- =============================================================================
-- This migration contains risky operations that require blue-green deployment
-- to ensure zero downtime. The migration will be executed on the inactive
-- environment and traffic will be switched after validation.
--
-- Risky operations include:
-- - DROP COLUMN/TABLE
-- - ALTER COLUMN (type changes)
-- - ADD NOT NULL constraints to existing columns
-- - RENAME COLUMN/TABLE
-- - Large data migrations
-- =============================================================================

-- WARNING: Risky operations below
-- Ensure you have tested this migration thoroughly in staging

-- Example: Drop unused column
-- ALTER TABLE users DROP COLUMN old_field;

-- Example: Change column type
-- ALTER TABLE users ALTER COLUMN age TYPE INTEGER USING age::INTEGER;

-- Example: Add NOT NULL constraint (risky for existing data)
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Example: Rename column
-- ALTER TABLE users RENAME COLUMN old_name TO new_name;

-- TODO: Add your migration SQL here
-- Replace the examples above with your actual migration code

-- =============================================================================
-- DATA MIGRATION (if required)
-- =============================================================================
-- Add any data migration scripts here
-- Use batched updates for large datasets

-- Example: Batch update for large tables
-- UPDATE users SET status = 'active' WHERE status IS NULL AND id <= 10000;

-- TODO: Add data migration code if needed

-- =============================================================================
-- END RISKY MIGRATION
-- =============================================================================

COMMIT;
EOF
}

# Function to generate maintenance migration template
generate_maintenance_template() {
    cat > "$MIGRATION_PATH" << EOF
-- Migration: $MIGRATION_NAME
-- Type: Maintenance (Planned Downtime Required)
-- Generated: $(date)
-- Description: Maintenance migration requiring planned downtime

-- =============================================================================
-- MAINTENANCE MIGRATION: $MIGRATION_NAME
-- =============================================================================
-- This migration requires planned downtime and will be executed directly on
-- the primary database with the application offline.
--
-- Maintenance operations include:
-- - Major schema restructuring
-- - Large table rebuilds
-- - Operations requiring exclusive locks
-- - Complex data migrations
-- =============================================================================

-- IMPORTANT: This migration requires application downtime
-- Ensure the application is stopped before executing

BEGIN;

-- Example: Major table restructuring
-- DROP TABLE IF EXISTS old_table;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS old_constraint;
-- CREATE TABLE new_structure AS SELECT * FROM users WHERE condition;

-- Example: Large data migration requiring exclusive access
-- UPDATE large_table SET computed_field = expensive_calculation(data)
--   WHERE computed_field IS NULL;

-- TODO: Add your maintenance migration SQL here
-- Replace the examples above with your actual migration code

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================
-- Add verification queries to ensure migration success

-- Example: Verify data integrity
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM users WHERE condition) THEN
--         RAISE EXCEPTION 'Migration verification failed: missing expected data';
--     END IF;
-- END $$;

-- TODO: Add verification queries

-- =============================================================================
-- END MAINTENANCE MIGRATION
-- =============================================================================

COMMIT;
EOF
}

# Function to create migration metadata
create_migration_metadata() {
    local metadata_file="$OUTPUT_DIR/.migration_${TIMESTAMP}_${MIGRATION_NAME}.json"

    cat > "$metadata_file" << EOF
{
  "migration_id": "${TIMESTAMP}_${MIGRATION_NAME}",
  "name": "$MIGRATION_NAME",
  "type": "$MIGRATION_TYPE",
  "timestamp": "$TIMESTAMP",
  "created_date": "$(date -Iseconds)",
  "filename": "$MIGRATION_FILE",
  "status": "pending",
  "description": "Generated migration template for $MIGRATION_NAME",
  "validation": {
    "schema_checked": false,
    "dry_run_completed": false,
    "risk_assessment": null
  },
  "execution": {
    "executed_date": null,
    "execution_time_ms": null,
    "rollback_file": null,
    "success": null
  }
}
EOF

    log_info "Created migration metadata: $(basename "$metadata_file")"
}

# Function to generate rollback template
generate_rollback_template() {
    local rollback_file="$OUTPUT_DIR/rollback_${TIMESTAMP}_${MIGRATION_NAME}.sql"

    cat > "$rollback_file" << EOF
-- Rollback Migration: $MIGRATION_NAME
-- Original Migration: $MIGRATION_FILE
-- Generated: $(date)
-- Description: Manual rollback script for $MIGRATION_NAME

-- =============================================================================
-- ROLLBACK SCRIPT: $MIGRATION_NAME
-- =============================================================================
-- This script contains the reverse operations for migration $MIGRATION_NAME
-- Use this script to manually rollback the migration if automatic rollback fails
-- =============================================================================

-- WARNING: Review this rollback script carefully before execution
-- Ensure you understand the implications of each rollback operation

BEGIN;

-- TODO: Add rollback SQL here
-- Write the reverse of each operation in your migration

-- If migration added a column, rollback drops it:
-- ALTER TABLE users DROP COLUMN IF EXISTS preferences;

-- If migration created an index, rollback drops it:
-- DROP INDEX IF EXISTS idx_users_created_at;

-- If migration added a constraint, rollback drops it:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_format;

-- =============================================================================
-- END ROLLBACK SCRIPT
-- =============================================================================

COMMIT;
EOF

    log_info "Created rollback template: $(basename "$rollback_file")"
}

# Main execution
main() {
    log_info "Generating $MIGRATION_TYPE migration template: $MIGRATION_NAME"

    # Check if migration file already exists
    if [[ -f "$MIGRATION_PATH" ]]; then
        log_error "Migration file already exists: $MIGRATION_FILE"
        exit 1
    fi

    # Generate appropriate template based on type
    case "$MIGRATION_TYPE" in
        "safe")
            generate_safe_template
            ;;
        "risky")
            generate_risky_template
            ;;
        "maintenance")
            generate_maintenance_template
            ;;
        *)
            log_error "Unknown migration type: $MIGRATION_TYPE"
            exit 1
            ;;
    esac

    # Make the file readable/writable
    chmod 644 "$MIGRATION_PATH"

    # Create metadata and rollback template
    create_migration_metadata
    generate_rollback_template

    log_success "Migration template generated successfully:"
    log_info "  File: $MIGRATION_PATH"
    log_info "  Type: $MIGRATION_TYPE"
    log_info "  Timestamp: $TIMESTAMP"

    echo ""
    echo "Next steps:"
    echo "1. Edit the migration file and add your SQL code"
    echo "2. Update the rollback script with reverse operations"
    echo "3. Test the migration in a development environment"
    echo "4. Validate with: docker-compose exec migration-controller node /app/src/schema-validator.js validate $MIGRATION_PATH"
    echo "5. Execute with: ./scripts/migration/execute-migration.sh --type $MIGRATION_TYPE $MIGRATION_PATH"

    return 0
}

# Execute main function
main
