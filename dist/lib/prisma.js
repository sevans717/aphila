"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
const prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ['error', 'warn'],
    });
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
//# sourceMappingURL=prisma.js.map