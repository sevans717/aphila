import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";
import { CommunityService } from "../services/community.service";
import { DiscoveryService } from "../services/discovery.service";

const router = Router();

// Validation schemas
const discoverQuerySchema = z.object({
  latitude: z.string().transform(Number).optional(),
  longitude: z.string().transform(Number).optional(),
  maxDistance: z.string().transform(Number).optional(),
  minAge: z.string().transform(Number).optional(),
  maxAge: z.string().transform(Number).optional(),
  orientation: z.string().optional(),
  interests: z
    .string()
    .optional()
    .transform((str) => (str ? str.split(",") : [])),
  limit: z.string().transform(Number).optional(),
});

const swipeSchema = z.object({
  swipedId: z.string(),
  isLike: z.boolean(),
  isSuper: z.boolean().optional().default(false),
});

// GET /discover - Get users for discovery
router.get(
  "/discover",
  requireAuth,
  validateRequest({ query: discoverQuerySchema }),
  async (req: any, res: any) => {
    try {
      const userId = req.user!.id;
      const filters = {
        userId,
        ...req.query,
      };

      const users = await DiscoveryService.discoverUsers(filters);

      res.json({
        success: true,
        data: users.map((user: any) => ({
          id: user.userId,
          displayName: user.displayName,
          age: user.birthdate
            ? Math.floor(
                (Date.now() - new Date(user.birthdate).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )
            : null,
          bio: user.bio,
          orientation: user.orientation,
          location:
            user.latitude && user.longitude
              ? {
                  latitude: user.latitude,
                  longitude: user.longitude,
                  city: user.city,
                  country: user.country,
                }
              : null,
          photos: user.user.photos,
          interests: user.user.interests,
          compatibilityScore: user.compatibilityScore,
          isVerified: user.isVerified,
          distance:
            req.query.latitude &&
            req.query.longitude &&
            user.latitude &&
            user.longitude
              ? Math.round(
                  DiscoveryService.calculateDistance(
                    parseFloat(req.query.latitude),
                    parseFloat(req.query.longitude),
                    user.latitude,
                    user.longitude
                  )
                )
              : null,
        })),
        pagination: {
          limit: filters.limit || 20,
          hasMore: users.length === (filters.limit || 20),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// POST /swipe - Handle swipe actions
router.post(
  "/swipe",
  requireAuth,
  validateRequest({ body: swipeSchema }),
  async (req: any, res: any) => {
    try {
      const swiperId = req.user!.id;
      const { swipedId, isLike, isSuper } = req.body;

      // Prevent self-swiping
      if (swiperId === swipedId) {
        return res.status(400).json({
          success: false,
          error: "Cannot swipe on yourself",
        });
      }

      const result = await DiscoveryService.handleSwipe({
        swiperId,
        swipedId,
        isLike,
        isSuper,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /matches - Get user's matches
router.get(
  "/matches",
  requireAuth,
  validateRequest({ query: z.object({}), params: z.object({}) }),
  async (req: any, res: any) => {
    try {
      const userId = req.user!.id;
      const matches = await DiscoveryService.getUserMatches(userId);

      res.json({
        success: true,
        data: matches.map((match: any) => {
          const otherUser =
            match.initiatorId === userId ? match.receiver : match.initiator;
          const lastMessage = match.messages[0];

          return {
            id: match.id,
            user: {
              id: otherUser.id,
              displayName: otherUser.profile?.displayName,
              bio: otherUser.profile?.bio,
              photo: otherUser.photos[0]?.url,
            },
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  sentAt: lastMessage.createdAt,
                  isFromMe: lastMessage.senderId === userId,
                }
              : null,
            matchedAt: match.createdAt,
            status: match.status,
          };
        }),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /likes - Get likes received
router.get(
  "/likes",
  requireAuth,
  validateRequest({ query: z.object({}), params: z.object({}) }),
  async (req: any, res: any) => {
    try {
      const userId = req.user!.id;
      const likes = await DiscoveryService.getReceivedLikes(userId);

      res.json({
        success: true,
        data: likes.map((like: any) => ({
          id: like.id,
          user: {
            id: like.liker.id,
            displayName: like.liker.profile?.displayName,
            bio: like.liker.profile?.bio,
            photo: like.liker.photos[0]?.url,
          },
          isSuper: like.isSuper,
          likedAt: like.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// GET /communities - simple passthrough for communities listing (compatibility)
router.get(
  "/communities",
  validateRequest({ query: z.object({ categoryId: z.string().optional() }) }),
  async (req, res) => {
    try {
      const { categoryId } = req.query as { categoryId?: string };
      const communities = await CommunityService.getAllCommunities(
        categoryId || undefined
      );
      res.json(communities);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch communities",
      });
    }
  }
);

export default router;
