#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Client } = require("pg");

// Migration schema validation utility
class SchemaValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode || false;
    this.allowedOperations = options.allowedOperations || [
      "ADD_COLUMN",
      "ADD_INDEX",
      "ADD_CONSTRAINT",
      "DROP_COLUMN",
      "DROP_INDEX",
      "DROP_CONSTRAINT",
      "ALTER_COLUMN",
    ];
  }

  async validateMigration(migrationSql) {
    const operations = this.parseSqlOperations(migrationSql);
    const validationResults = {
      isValid: true,
      operations: operations,
      warnings: [],
      errors: [],
      riskLevel: "LOW",
    };

    for (const op of operations) {
      const validation = this.validateOperation(op);

      if (!validation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push(validation.error);
      }

      if (validation.warnings) {
        validationResults.warnings.push(...validation.warnings);
      }

      // Update risk level
      if (validation.riskLevel === "HIGH") {
        validationResults.riskLevel = "HIGH";
      } else if (
        validation.riskLevel === "MEDIUM" &&
        validationResults.riskLevel !== "HIGH"
      ) {
        validationResults.riskLevel = "MEDIUM";
      }
    }

    return validationResults;
  }

  parseSqlOperations(sql) {
    const operations = [];
    const lines = sql.split("\n");

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith("alter table")) {
        if (trimmed.includes("add column")) {
          operations.push({
            type: "ADD_COLUMN",
            statement: line.trim(),
            riskLevel: "LOW",
          });
        } else if (trimmed.includes("drop column")) {
          operations.push({
            type: "DROP_COLUMN",
            statement: line.trim(),
            riskLevel: "HIGH",
          });
        } else if (trimmed.includes("add constraint")) {
          operations.push({
            type: "ADD_CONSTRAINT",
            statement: line.trim(),
            riskLevel: "MEDIUM",
          });
        } else if (trimmed.includes("drop constraint")) {
          operations.push({
            type: "DROP_CONSTRAINT",
            statement: line.trim(),
            riskLevel: "MEDIUM",
          });
        } else if (trimmed.includes("alter column")) {
          operations.push({
            type: "ALTER_COLUMN",
            statement: line.trim(),
            riskLevel: "HIGH",
          });
        }
      } else if (trimmed.startsWith("create index")) {
        operations.push({
          type: "ADD_INDEX",
          statement: line.trim(),
          riskLevel: "LOW",
        });
      } else if (trimmed.startsWith("drop index")) {
        operations.push({
          type: "DROP_INDEX",
          statement: line.trim(),
          riskLevel: "LOW",
        });
      } else if (trimmed.startsWith("create table")) {
        operations.push({
          type: "CREATE_TABLE",
          statement: line.trim(),
          riskLevel: "LOW",
        });
      } else if (trimmed.startsWith("drop table")) {
        operations.push({
          type: "DROP_TABLE",
          statement: line.trim(),
          riskLevel: "HIGH",
        });
      }
    }

    return operations;
  }

  validateOperation(operation) {
    const result = {
      isValid: true,
      warnings: [],
      riskLevel: operation.riskLevel,
    };

    // Check if operation is allowed
    if (!this.allowedOperations.includes(operation.type)) {
      result.isValid = false;
      result.error = `Operation ${operation.type} is not allowed`;
      return result;
    }

    // Operation-specific validations
    switch (operation.type) {
      case "DROP_COLUMN":
      case "DROP_TABLE":
        if (this.strictMode) {
          result.isValid = false;
          result.error = `Destructive operation ${operation.type} not allowed in strict mode`;
        } else {
          result.warnings.push(
            `Destructive operation detected: ${operation.statement}`
          );
        }
        break;

      case "ALTER_COLUMN":
        result.warnings.push(
          `Column alteration may require table rewrite: ${operation.statement}`
        );
        break;

      case "ADD_CONSTRAINT":
        if (operation.statement.toLowerCase().includes("not null")) {
          result.warnings.push(
            `NOT NULL constraint may fail on existing data: ${operation.statement}`
          );
        }
        break;
    }

    return result;
  }
}

// Migration rollback manager
class RollbackManager {
  constructor(options = {}) {
    this.backupDir = options.backupDir || "/var/lib/postgresql/backups";
    this.maxRollbacks = options.maxRollbacks || 5;
  }

  async createRollbackPoint(dbConfig, migrationId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = `${this.backupDir}/rollback-${migrationId}-${timestamp}.sql`;

    try {
      // Create schema dump before migration
      const dumpCommand = `pg_dump -s -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${backupFile}`;
      execSync(dumpCommand, { env: { PGPASSWORD: dbConfig.password } });

      console.log(`✓ Created rollback point: ${backupFile}`);

      // Clean up old rollback points
      await this.cleanupOldRollbacks();

      return backupFile;
    } catch (error) {
      console.error("✗ Failed to create rollback point:", error.message);
      throw error;
    }
  }

  async executeRollback(dbConfig, rollbackFile) {
    try {
      console.log(`🔄 Executing rollback from: ${rollbackFile}`);

      // Restore schema from rollback point
      const restoreCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${rollbackFile}`;
      execSync(restoreCommand, { env: { PGPASSWORD: dbConfig.password } });

      console.log("✓ Rollback completed successfully");
      return true;
    } catch (error) {
      console.error("✗ Rollback failed:", error.message);
      throw error;
    }
  }

  async cleanupOldRollbacks() {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.startsWith("rollback-"))
        .map((f) => ({
          name: f,
          path: path.join(this.backupDir, f),
          mtime: fs.statSync(path.join(this.backupDir, f)).mtime,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Remove excess rollback files
      if (files.length > this.maxRollbacks) {
        const toRemove = files.slice(this.maxRollbacks);
        for (const file of toRemove) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Cleaned up old rollback: ${file.name}`);
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to cleanup old rollbacks:", error.message);
    }
  }
}

// Migration execution engine
class MigrationEngine {
  constructor(options = {}) {
    this.validator = new SchemaValidator(options.validation || {});
    this.rollbackManager = new RollbackManager(options.rollback || {});
    this.dryRun = options.dryRun || false;
    this.timeout = options.timeout || 300000; // 5 minutes
  }

  async executeMigration(dbConfig, migrationSql, migrationId) {
    console.log(`🚀 Starting migration: ${migrationId}`);

    // Validate migration
    const validation = await this.validator.validateMigration(migrationSql);

    if (!validation.isValid) {
      console.error("❌ Migration validation failed:");
      validation.errors.forEach((error) => console.error(`  - ${error}`));
      throw new Error("Migration validation failed");
    }

    // Show warnings
    if (validation.warnings.length > 0) {
      console.warn("⚠️ Migration warnings:");
      validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    console.log(`📊 Risk Level: ${validation.riskLevel}`);

    if (this.dryRun) {
      console.log(
        "🔍 DRY RUN - Migration would execute the following operations:"
      );
      validation.operations.forEach((op) => {
        console.log(`  ${op.type}: ${op.statement}`);
      });
      return { success: true, dryRun: true };
    }

    // Create rollback point
    let rollbackFile;
    try {
      rollbackFile = await this.rollbackManager.createRollbackPoint(
        dbConfig,
        migrationId
      );
    } catch (error) {
      console.error("❌ Failed to create rollback point");
      throw error;
    }

    // Execute migration
    const client = new Client(dbConfig);
    // let migrationSuccess = false;

    try {
      await client.connect();
      console.log("🔗 Connected to database");

      // Set statement timeout
      await client.query(`SET statement_timeout = ${this.timeout}`);

      // Begin transaction
      await client.query("BEGIN");
      console.log("📝 Started migration transaction");

      // Execute migration SQL
      await client.query(migrationSql);
      console.log("✅ Migration SQL executed successfully");

      // Commit transaction
      await client.query("COMMIT");
      console.log("💾 Migration committed");

      // migrationSuccess = true;
      return { success: true, rollbackFile };
    } catch (error) {
      console.error("❌ Migration failed:", error.message);

      try {
        await client.query("ROLLBACK");
        console.log("🔄 Transaction rolled back");
      } catch (rollbackError) {
        console.error("❌ Rollback failed:", rollbackError.message);
      }

      // Attempt schema rollback if needed
      if (validation.riskLevel === "HIGH") {
        try {
          await this.rollbackManager.executeRollback(dbConfig, rollbackFile);
        } catch (rollbackError) {
          console.error("❌ Schema rollback failed:", rollbackError.message);
        }
      }

      throw error;
    } finally {
      await client.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Export for use as module
module.exports = {
  SchemaValidator,
  RollbackManager,
  MigrationEngine,
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: node schema-validator.js <command> [options]");
    console.log("Commands:");
    console.log("  validate <sql-file>     - Validate migration SQL");
    console.log("  execute <sql-file>      - Execute migration");
    console.log("  rollback <backup-file>  - Rollback to backup");
    process.exit(1);
  }

  const command = args[0];
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "sav3_app",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  };

  async function main() {
    try {
      switch (command) {
        case "validate":
          if (!args[1]) {
            console.error("SQL file required");
            process.exit(1);
          }
          const sql = fs.readFileSync(args[1], "utf8");
          const validator = new SchemaValidator();
          const result = await validator.validateMigration(sql);
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.isValid ? 0 : 1);
          break;

        case "execute":
          if (!args[1]) {
            console.error("SQL file required");
            process.exit(1);
          }
          const migrationSql = fs.readFileSync(args[1], "utf8");
          const migrationId = path.basename(args[1], ".sql");
          const engine = new MigrationEngine({
            dryRun: args.includes("--dry-run"),
          });
          const execResult = await engine.executeMigration(
            dbConfig,
            migrationSql,
            migrationId
          );
          console.log("Migration completed:", execResult);
          break;

        case "rollback":
          if (!args[1]) {
            console.error("Backup file required");
            process.exit(1);
          }
          const rollbackManager = new RollbackManager();
          await rollbackManager.executeRollback(dbConfig, args[1]);
          break;

        default:
          console.error("Unknown command:", command);
          process.exit(1);
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  main();
}
