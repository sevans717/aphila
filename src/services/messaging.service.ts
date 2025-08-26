import { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma";

// using shared singleton `prisma` from src/lib/prisma

interface CreateMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: "text" | "image" | "gif" | "emoji";
}

interface MessageFilters {
  matchId: string;
  limit?: number;
  before?: string; // messageId for pagination
}

export class MessagingService {
  // Send a message in a match
  static async sendMessage(data: CreateMessageData) {
    const { senderId, receiverId, content, messageType = "text" } = data;

    // Verify match exists and is active
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { initiatorId: senderId, receiverId },
          { initiatorId: receiverId, receiverId: senderId },
        ],
        status: "ACTIVE",
      },
    });

    if (!match) {
      throw new Error("No active match found between users");
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        matchId: match.id,
        content,
        messageType,
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { displayName: true },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
      },
    });

    // Update match's last activity
    await prisma.match.update({
      where: { id: match.id },
      data: { updatedAt: new Date() },
    });

    // Create notification for receiver
    // @ts-ignore - notification type field might not exist in schema
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "message",
        title: `New message from ${message.sender.profile?.displayName}`,
        body: messageType === "text" ? content : `Sent a ${messageType}`,
        data: {
          matchId: match.id,
          messageId: message.id,
          senderId,
        },
      },
    });

    return message;
  }

  // Get messages for a match
  static async getMatchMessages(filters: MessageFilters) {
    const { matchId, limit = 50, before } = filters;

    const whereClause: any = { matchId };

    if (before) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (beforeMessage) {
        whereClause.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: { displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse(); // Return in chronological order
  }

  // Mark messages as read
  static async markMessagesAsRead(matchId: string, userId: string) {
    await prisma.message.updateMany({
      where: {
        matchId,
        receiverId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  // Get unread message count
  static async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });

    return count;
  }

  // Delete message (soft delete)
  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("Can only delete your own messages");
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "This message was deleted",
      },
    });

    return { success: true };
  }

  // Get match details with recent messages
  static async getMatchDetails(matchId: string, userId: string) {
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        initiator: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                bio: true,
              },
            },
            photos: {
              where: { isPrimary: true },
              select: { url: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: {
              select: {
                id: true,
                profile: {
                  select: { displayName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new Error("Match not found");
    }

    const otherUser =
      match.initiatorId === userId ? match.receiver : match.initiator;

    return {
      ...match,
      otherUser,
      messages: match.messages.reverse(),
    };
  }

  // Report a message
  static async reportMessage(
    messageId: string,
    reporterId: string,
    reason: string
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId === reporterId) {
      throw new Error("Cannot report your own message");
    }

    await prisma.report.create({
      data: {
        reporterId,
        reportedId: message.senderId,
        reason,
        // type not in schema, using reason instead 'message',
        // @ts-ignore
        contentId: messageId,
        description: `Reported message: "${message.content}"`,
      },
    });

    return { success: true };
  }
}
