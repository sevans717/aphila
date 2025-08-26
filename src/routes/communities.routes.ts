import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { CommunityService } from "../services/community.service";

const router = Router();

const createCommunitySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SECRET"]),
  categoryId: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  messageType: z.string().optional(),
});

// Get all communities (optionally filtered by category)
router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const communities = await CommunityService.getAllCommunities(
      categoryId as string
    );
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch communities" });
  }
});

// Get community by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const community = await CommunityService.getCommunityById(id);

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch community" });
  }
});

// Create community
router.post(
  "/",
  requireAuth,
  validateRequest({ body: createCommunitySchema }),
  async (req, res) => {
    try {
      const data = req.body;
      const ownerId = req.user!.userId;

      const community = await CommunityService.createCommunity({
        ...data,
        ownerId,
      });

      res.status(201).json(community);
    } catch (error) {
      res.status(500).json({ error: "Failed to create community" });
    }
  }
);

// Join community
router.post(
  "/:id/join",
  requireAuth,
  validateRequest({ params: z.object({ id: z.string() }) }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const membership = await CommunityService.joinCommunity(userId, id);
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to join community" });
    }
  }
);

// Leave community
router.delete("/:id/leave", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    await CommunityService.leaveCommunity(userId, id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to leave community" });
  }
});

// Send message to community
router.post(
  "/:id/messages",
  requireAuth,
  validateRequest({
    params: z.object({ id: z.string() }),
    body: sendMessageSchema,
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const senderId = req.user!.userId;

      const message = await CommunityService.sendMessage({
        ...data,
        communityId: id,
        senderId,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export default router;
