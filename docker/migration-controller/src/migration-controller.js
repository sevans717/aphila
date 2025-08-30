const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { Client } = require("pg");

// Migration Controller
// Orchestrates zero-downtime migrations with blue-green strategy

class MigrationController {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;

    // Database connections
    this.blueDbUrl = process.env.BLUE_DATABASE_URL;
    this.greenDbUrl = process.env.GREEN_DATABASE_URL;

    // Configuration
    this.migrationMode = process.env.MIGRATION_MODE || "blue-green";
    this.rollbackEnabled = process.env.ROLLBACK_ENABLED === "true";
    this.maxDowntimeSeconds = parseInt(process.env.MAX_DOWNTIME_SECONDS) || 30;
    this.validationTimeoutSeconds =
      parseInt(process.env.VALIDATION_TIMEOUT_SECONDS) || 300;

    // State
    this.currentEnvironment = "blue"; // Start with blue as active
    this.migrationInProgress = false;
    this.lastMigration = null;

    this.setupRoutes();
    this.setupMiddleware();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        currentEnvironment: this.currentEnvironment,
        migrationInProgress: this.migrationInProgress,
        lastMigration: this.lastMigration,
      });
    });

    // Get current status
    this.app.get("/status", async (req, res) => {
      try {
        const status = await this.getCurrentStatus();
        res.json(status);
      } catch (error) {
        console.error("Error getting status:", error);
        res.status(500).json({ error: "Failed to get status" });
      }
    });

    // Start migration
    this.app.post("/migrate", async (req, res) => {
      try {
        if (this.migrationInProgress) {
          return res.status(409).json({
            error: "Migration already in progress",
          });
        }

        const { migrationPath, validateOnly = false } = req.body;

        if (!migrationPath) {
          return res.status(400).json({
            error: "Migration path is required",
          });
        }

        this.migrationInProgress = true;

        const result = validateOnly
          ? await this.validateMigration(migrationPath)
          : await this.executeMigration(migrationPath);

        this.migrationInProgress = false;
        res.json(result);
      } catch (error) {
        this.migrationInProgress = false;
        console.error("Migration error:", error);
        res.status(500).json({
          error: "Migration failed",
          details: error.message,
        });
      }
    });

    // Rollback migration
    this.app.post("/rollback", async (req, res) => {
      try {
        if (!this.rollbackEnabled) {
          return res.status(403).json({
            error: "Rollback is disabled",
          });
        }

        const { migrationId } = req.body;
        const result = await this.rollbackMigration(migrationId);
        res.json(result);
      } catch (error) {
        console.error("Rollback error:", error);
        res.status(500).json({
          error: "Rollback failed",
          details: error.message,
        });
      }
    });

    // Switch environment (blue/green)
    this.app.post("/switch", async (req, res) => {
      try {
        const result = await this.switchEnvironment();
        res.json(result);
      } catch (error) {
        console.error("Switch error:", error);
        res.status(500).json({
          error: "Environment switch failed",
          details: error.message,
        });
      }
    });

    // Get migration history
    this.app.get("/migrations", async (req, res) => {
      try {
        const history = await this.getMigrationHistory();
        res.json(history);
      } catch (error) {
        console.error("Error getting migration history:", error);
        res.status(500).json({ error: "Failed to get migration history" });
      }
    });
  }

  async getCurrentStatus() {
    const blueHealth = await this.checkDatabaseHealth(this.blueDbUrl, "blue");
    const greenHealth = await this.checkDatabaseHealth(
      this.greenDbUrl,
      "green"
    );

    return {
      currentEnvironment: this.currentEnvironment,
      migrationInProgress: this.migrationInProgress,
      lastMigration: this.lastMigration,
      environments: {
        blue: blueHealth,
        green: greenHealth,
      },
      configuration: {
        migrationMode: this.migrationMode,
        rollbackEnabled: this.rollbackEnabled,
        maxDowntimeSeconds: this.maxDowntimeSeconds,
        validationTimeoutSeconds: this.validationTimeoutSeconds,
      },
    };
  }

  async checkDatabaseHealth(dbUrl, environment) {
    try {
      const client = new Client({ connectionString: dbUrl });
      await client.connect();

      // Check basic connectivity
      const result = await client.query(
        "SELECT NOW() as current_time, version() as version"
      );

      // Check migration tracking table
      const migrationCheck = await client.query(
        `
                SELECT COUNT(*) as migration_count
                FROM _migration_tracking
                WHERE environment = $1
            `,
        [environment]
      );

      await client.end();

      return {
        status: "healthy",
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        migrationCount: parseInt(migrationCheck.rows[0].migration_count),
        environment,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        environment,
      };
    }
  }

  async validateMigration(migrationPath) {
    console.log(`Validating migration: ${migrationPath}`);

    const migrationContent = await fs.readFile(migrationPath, "utf8");
    const migrationId = path.basename(migrationPath, ".sql");

    // Connect to inactive environment for validation
    const targetEnv = this.currentEnvironment === "blue" ? "green" : "blue";
    const targetDbUrl = targetEnv === "blue" ? this.blueDbUrl : this.greenDbUrl;

    const client = new Client({ connectionString: targetDbUrl });
    await client.connect();

    try {
      // Validate migration safety
      const safetyCheck = await client.query(
        "SELECT * FROM validate_migration_safety($1)",
        [migrationContent]
      );

      const { is_safe, risk_level, warnings } = safetyCheck.rows[0];

      await client.end();

      return {
        migrationId,
        targetEnvironment: targetEnv,
        validation: {
          isSafe: is_safe,
          riskLevel: risk_level,
          warnings: warnings || [],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await client.end();
      throw error;
    }
  }

  async executeMigration(migrationPath) {
    const startTime = Date.now();
    const migrationId = path.basename(migrationPath, ".sql");

    console.log(`Starting migration: ${migrationId}`);

    // Step 1: Validate migration
    const validation = await this.validateMigration(migrationPath);

    if (
      !validation.validation.isSafe &&
      validation.validation.riskLevel === "HIGH"
    ) {
      throw new Error(
        "Migration failed validation: contains high-risk operations"
      );
    }

    // Step 2: Prepare target environment
    const targetEnv = this.currentEnvironment === "blue" ? "green" : "blue";
    const targetDbUrl = targetEnv === "blue" ? this.blueDbUrl : this.greenDbUrl;

    // Step 3: Run migration on target environment
    await this.runMigrationOnEnvironment(migrationPath, targetEnv, targetDbUrl);

    // Step 4: Validate target environment
    const validationResult = await this.validateEnvironment(targetEnv);

    if (!validationResult.isValid) {
      throw new Error(
        `Target environment validation failed: ${validationResult.errors.join(", ")}`
      );
    }

    // Step 5: Switch traffic (blue-green swap)
    await this.switchEnvironment();

    const executionTime = Date.now() - startTime;

    this.lastMigration = {
      migrationId,
      fromEnvironment: this.currentEnvironment === "blue" ? "green" : "blue",
      toEnvironment: this.currentEnvironment,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      status: "completed",
    };

    return {
      migrationId,
      status: "completed",
      executionTimeMs: executionTime,
      currentEnvironment: this.currentEnvironment,
      validation: validation.validation,
      targetValidation: validationResult,
    };
  }

  async runMigrationOnEnvironment(migrationPath, environment, dbUrl) {
    console.log(`Running migration on ${environment} environment`);

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
      // Begin transaction
      await client.query("BEGIN");

      // Record migration start
      const migrationId = path.basename(migrationPath, ".sql");
      await client.query(
        `
                INSERT INTO _migration_tracking
                (migration_id, migration_name, environment, status, checksum)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (migration_id)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    started_at = NOW(),
                    updated_at = NOW()
            `,
        [
          migrationId,
          migrationId,
          environment,
          "running",
          "checksum_placeholder",
        ]
      );

      // Read and execute migration
      const migrationSQL = await fs.readFile(migrationPath, "utf8");
      await client.query(migrationSQL);

      // Update migration status
      await client.query(
        `
                UPDATE _migration_tracking
                SET status = $1, completed_at = NOW(), updated_at = NOW(),
                    execution_time_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
                WHERE migration_id = $2 AND environment = $3
            `,
        ["completed", migrationId, environment]
      );

      // Commit transaction
      await client.query("COMMIT");

      console.log(
        `Migration ${migrationId} completed successfully on ${environment}`
      );
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK");

      // Record failure
      const migrationId = path.basename(migrationPath, ".sql");
      await client.query(
        `
                UPDATE _migration_tracking
                SET status = $1, error_message = $2, updated_at = NOW()
                WHERE migration_id = $3 AND environment = $4
            `,
        ["failed", error.message, migrationId, environment]
      );

      throw error;
    } finally {
      await client.end();
    }
  }

  async validateEnvironment(environment) {
    console.log(`Validating ${environment} environment`);

    const dbUrl = environment === "blue" ? this.blueDbUrl : this.greenDbUrl;
    const client = new Client({ connectionString: dbUrl });

    try {
      await client.connect();

      // Run basic validation queries
      const validations = [
        { name: "basic_connectivity", query: "SELECT 1" },
        {
          name: "schema_exists",
          query:
            "SELECT schemaname FROM pg_tables WHERE schemaname = 'public' LIMIT 1",
        },
        {
          name: "migration_tracking",
          query: "SELECT COUNT(*) FROM _migration_tracking",
        },
      ];

      const results = [];
      const errors = [];

      for (const validation of validations) {
        try {
          const result = await client.query(validation.query);
          results.push({
            name: validation.name,
            status: "passed",
            result: result.rows,
          });
        } catch (error) {
          results.push({
            name: validation.name,
            status: "failed",
            error: error.message,
          });
          errors.push(`${validation.name}: ${error.message}`);
        }
      }

      await client.end();

      return {
        environment,
        isValid: errors.length === 0,
        validations: results,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await client.end();
      return {
        environment,
        isValid: false,
        errors: [error.message],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async switchEnvironment() {
    console.log(
      `Switching from ${this.currentEnvironment} to ${this.currentEnvironment === "blue" ? "green" : "blue"}`
    );

    // Update nginx upstream configuration
    const newEnvironment =
      this.currentEnvironment === "blue" ? "green" : "blue";
    const upstreamConfig = `
upstream postgres_backend {
    server postgres-${newEnvironment}:5432 max_fails=3 fail_timeout=30s;
}
        `;

    await fs.writeFile("/app/tmp/upstream.conf", upstreamConfig);

    // Reload nginx configuration (would need proper implementation)
    console.log(`Would reload nginx to switch to ${newEnvironment}`);

    // Update current environment
    this.currentEnvironment = newEnvironment;

    return {
      previousEnvironment:
        this.currentEnvironment === "blue" ? "green" : "blue",
      currentEnvironment: this.currentEnvironment,
      switchedAt: new Date().toISOString(),
    };
  }

  async rollbackMigration(migrationId) {
    console.log(`Rolling back migration: ${migrationId}`);

    // Switch back to previous environment
    // const previousEnv = this.currentEnvironment === "blue" ? "green" : "blue";

    // Record rollback
    const dbUrl =
      this.currentEnvironment === "blue" ? this.blueDbUrl : this.greenDbUrl;
    const client = new Client({ connectionString: dbUrl });

    await client.connect();

    try {
      await client.query(
        `
                UPDATE _migration_tracking
                SET status = $1, rollback_at = NOW(), updated_at = NOW()
                WHERE migration_id = $2
            `,
        ["rolled_back", migrationId]
      );

      await client.end();

      // Switch environment
      await this.switchEnvironment();

      return {
        migrationId,
        status: "rolled_back",
        rolledBackTo: this.currentEnvironment,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await client.end();
      throw error;
    }
  }

  async getMigrationHistory() {
    const client = new Client({
      connectionString:
        this.currentEnvironment === "blue" ? this.blueDbUrl : this.greenDbUrl,
    });

    try {
      await client.connect();

      const result = await client.query(`
                SELECT * FROM _migration_tracking
                ORDER BY started_at DESC
                LIMIT 50
            `);

      await client.end();

      return {
        migrations: result.rows,
        count: result.rows.length,
        currentEnvironment: this.currentEnvironment,
      };
    } catch (error) {
      await client.end();
      throw error;
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Migration Controller listening on port ${this.port}`);
      console.log(`Current environment: ${this.currentEnvironment}`);
      console.log(`Migration mode: ${this.migrationMode}`);
      console.log(`Rollback enabled: ${this.rollbackEnabled}`);
    });
  }
}

// Start the migration controller
const controller = new MigrationController();
controller.start();
