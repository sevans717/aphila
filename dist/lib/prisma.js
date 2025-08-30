"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaReplica = exports.prisma = exports.getPgBouncerStats = exports.checkDatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
// Primary database connection (read/write)
const prisma = globalForPrisma.prisma ||
    (() => {
        const prismaOptions = {
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        };
        // Connection pooling configuration for PgBouncer
        if (process.env.DATABASE_CONNECTION_LIMIT) {
            prismaOptions.__internal = {
                useTransactionApi: false,
                engine: {
                    // Connection pool settings
                    connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10),
                    pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || "20000", 10),
                    socket_timeout: parseInt(process.env.DATABASE_SOCKET_TIMEOUT || "30000", 10),
                },
            };
        }
        return new client_1.PrismaClient(prismaOptions);
    })();
exports.prisma = prisma;
// Read replica connection (read-only queries)
const prismaReplica = globalForPrisma.prismaReplica ||
    (process.env.DATABASE_URL_REPLICA
        ? (() => {
            const replicaOptions = {
                log: process.env.NODE_ENV === "development"
                    ? ["query", "error", "warn"]
                    : ["error"],
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL_REPLICA,
                    },
                },
            };
            if (process.env.DATABASE_CONNECTION_LIMIT) {
                replicaOptions.__internal = {
                    useTransactionApi: false,
                    engine: {
                        connection_limit: Math.floor(parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10) * 0.5), // 50% of primary pool
                        pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || "20000", 10),
                        socket_timeout: parseInt(process.env.DATABASE_SOCKET_TIMEOUT || "30000", 10),
                    },
                };
            }
            return new client_1.PrismaClient(replicaOptions);
        })()
        : prisma); // Fallback to primary if no replica configured
exports.prismaReplica = prismaReplica;
// Connection health check
const checkDatabaseConnection = async () => {
    const results = {
        primary: false,
        replica: false,
        latency: { primary: 0, replica: undefined },
    };
    try {
        const primaryStart = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        results.primary = true;
        results.latency.primary = Date.now() - primaryStart;
    }
    catch (error) {
        console.error("Primary database connection failed:", error);
    }
    if (prismaReplica !== prisma) {
        try {
            const replicaStart = Date.now();
            await prismaReplica.$queryRaw `SELECT 1`;
            results.replica = true;
            results.latency.replica = Date.now() - replicaStart;
        }
        catch (error) {
            console.error("Replica database connection failed:", error);
        }
    }
    else {
        results.replica = results.primary; // Same instance
    }
    return results;
};
exports.checkDatabaseConnection = checkDatabaseConnection;
// PgBouncer pool status check
const getPgBouncerStats = async () => {
    try {
        // This requires connecting to the pgbouncer admin database
        const stats = await prisma.$queryRawUnsafe(`
      SELECT
        database,
        user_name,
        cl_active,
        cl_waiting,
        cl_cancel_req,
        sv_active,
        sv_idle,
        sv_used,
        sv_tested,
        sv_login,
        maxwait,
        maxwait_us,
        pool_mode
      FROM pgbouncer.pg_stat_activity
      WHERE database != 'pgbouncer'
    `);
        return stats;
    }
    catch (error) {
        // Fallback: this might not work if not connected to pgbouncer admin
        console.warn("Could not fetch PgBouncer stats:", error);
        return null;
    }
};
exports.getPgBouncerStats = getPgBouncerStats;
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaReplica = prismaReplica;
}
//# sourceMappingURL=prisma.js.map