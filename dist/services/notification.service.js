"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = require("../lib/prisma");
class NotificationService {
    static async create(input) {
        return prisma_1.prisma.notification.create({ data: { ...input, data: input.data } });
    }
    static async bulkCreate(notifications) {
        return prisma_1.prisma.$transaction(notifications.map(n => prisma_1.prisma.notification.create({ data: { ...n, data: n.data } })));
    }
    static async list(userId, options = {}) {
        const { limit = 20, cursor } = options;
        const items = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });
        let nextCursor;
        if (items.length > limit) {
            const next = items.pop();
            nextCursor = next?.id;
        }
        return { items, nextCursor };
    }
    static async markRead(userId, ids) {
        await prisma_1.prisma.notification.updateMany({ where: { userId, id: { in: ids } }, data: { isRead: true } });
        return { success: true };
    }
    static async markAllRead(userId) {
        await prisma_1.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
        return { success: true };
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map