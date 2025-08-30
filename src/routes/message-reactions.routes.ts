import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createReactionSchema = z.object({
  messageId: z.string(),
  reaction: z.string().min(1).max(50),
});

const replyMessageSchema = z.object({
  matchId: z.string(),
  content: z.string().min(1).max(1000),
  messageType: z.string().default("text"),
  parentId: z.string(),
});

// Create message reaction
router.post(
  "/reactions",
  requireAuth,
  validateRequest({ body: createReactionSchema }),
  async (req, res) => {
    try {
      const { messageId, reaction } = req.body;
      const userId = req.user!.id;

      // Check if message exists and user has access
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          match: {
            include: {
              initiator: true,
              receiver: true,
            },
          },
        },
      });

      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if user is part of the match
      if (
        message.match.initiatorId !== userId &&
        message.match.receiverId !== userId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if reaction already exists
      const existingReaction = await prisma.messageReaction.findUnique({
        where: {
          messageId_userId_reaction: {
            messageId,
            userId,
            reaction,
          },
        },
      });

      if (existingReaction) {
        return res.status(409).json({ error: "Reaction already exists" });
      }

      // Create reaction
      const newReaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          reaction,
        },
        include: {
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(newReaction);
    } catch (error) {
      console.error("Error creating reaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Remove message reaction
router.delete("/reactions/:reactionId", requireAuth, async (req, res) => {
  try {
    const { reactionId } = req.params;
    const userId = req.user!.id;

    // Find and delete reaction
    const reaction = await prisma.messageReaction.findUnique({
      where: { id: reactionId },
    });

    if (!reaction) {
      return res.status(404).json({ error: "Reaction not found" });
    }

    if (reaction.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.messageReaction.delete({
      where: { id: reactionId },
    });

    res.status(200).json({ message: "Reaction removed" });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reactions for a message
router.get("/messages/:messageId/reactions", requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Check if message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        match: {
          include: {
            initiator: true,
            receiver: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is part of the match
    if (
      message.match.initiatorId !== userId &&
      message.match.receiverId !== userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get reactions
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group reactions by type
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.reaction]) {
          acc[reaction.reaction] = [];
        }
        acc[reaction.reaction].push(reaction);
        return acc;
      },
      {} as Record<string, typeof reactions>
    );

    res.json(groupedReactions);
  } catch (error) {
    console.error("Error getting reactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reply to a message (create threaded message)
router.post(
  "/messages/reply",
  requireAuth,
  validateRequest({ body: replyMessageSchema }),
  async (req, res) => {
    try {
      const { matchId, content, messageType, parentId } = req.body;
      const userId = req.user!.id;

      // Check if parent message exists and user has access
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId },
        include: {
          match: true,
        },
      });

      if (!parentMessage) {
        return res.status(404).json({ error: "Parent message not found" });
      }

      if (parentMessage.matchId !== matchId) {
        return res
          .status(400)
          .json({ error: "Parent message not in this match" });
      }

      // Check if user is part of the match
      if (
        parentMessage.match.initiatorId !== userId &&
        parentMessage.match.receiverId !== userId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create reply message
      const replyMessage = await prisma.message.create({
        data: {
          matchId,
          senderId: userId,
          receiverId:
            parentMessage.senderId === userId
              ? parentMessage.receiverId
              : parentMessage.senderId,
          content,
          messageType,
          parentId,
          status: "SENT",
        },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          replies: true,
        },
      });

      res.status(201).json(replyMessage);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get message thread (message with all replies)
router.get("/messages/:messageId/thread", requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    // Get the root message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        match: {
          include: {
            initiator: true,
            receiver: true,
          },
        },
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is part of the match
    if (
      message.match.initiatorId !== userId &&
      message.match.receiverId !== userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all replies recursively
    const getReplies = async (parentId: string): Promise<any[]> => {
      const replies = await prisma.message.findMany({
        where: { parentId },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Recursively get replies for each reply
      for (const reply of replies) {
        (reply as any).replies = await getReplies(reply.id);
      }

      return replies;
    };

    // Get all replies for the root message
    const replies = await getReplies(messageId);

    res.json({
      ...message,
      replies,
    });
  } catch (error) {
    console.error("Error getting message thread:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
