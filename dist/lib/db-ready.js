"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseReady = checkDatabaseReady;
const prisma_1 = require("../lib/prisma");
async function checkDatabaseReady(timeoutMs = 1500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        // Lightweight query
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        clearTimeout(timer);
        return { ok: true };
    }
    catch (err) {
        clearTimeout(timer);
        return { ok: false, error: err.message || String(err) };
    }
}
//# sourceMappingURL=db-ready.js.map