import { prisma } from '../lib/prisma';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  static async create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: { ...input, data: input.data as any } });
  }

  static async bulkCreate(notifications: CreateNotificationInput[]) {
    return prisma.$transaction(notifications.map(n => prisma.notification.create({ data: { ...n, data: n.data as any } })));
  }

  static async list(userId: string, options: { limit?: number; cursor?: string } = {}) {
    const { limit = 20, cursor } = options;
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });
    let nextCursor: string | undefined;
    if (items.length > limit) {
      const next = items.pop();
      nextCursor = next?.id;
    }
    return { items, nextCursor };
  }

  static async markRead(userId: string, ids: string[]) {
    await prisma.notification.updateMany({ where: { userId, id: { in: ids } }, data: { isRead: true } });
    return { success: true };
  }

  static async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true };
  }
}
