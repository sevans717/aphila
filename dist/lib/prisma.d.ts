import { PrismaClient } from "@prisma/client";
declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare const prismaReplica: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const checkDatabaseConnection: () => Promise<{
    primary: boolean;
    replica: boolean;
    latency: {
        primary: number;
        replica?: number;
    };
}>;
export declare const getPgBouncerStats: () => Promise<any>;
export { prisma, prismaReplica };
//# sourceMappingURL=prisma.d.ts.map