import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import analyticsRoutes from "./analytics.routes";
import authRoutes from "./auth";
import bookmarksRoutes from "./bookmarks.routes";
import categoriesRoutes from "./categories.routes";
import communitiesRoutes from "./communities.routes";
import discoveryRoutes from "./discovery.routes";
import geospatialRoutes from "./geospatial.routes";
import mediaRoutes from "./media.routes";
import messageReactionsRoutes from "./message-reactions.routes";
import messagingRoutes from "./messaging.routes";
import mobileRoutes from "./mobile.routes";
import moderationRoutes from "./moderation.routes";
import notificationsRoutes from "./notifications.routes";
import postsRoutes from "./posts.routes";
import presenceRoutes from "./presence.routes";
import searchRoutes from "./search.routes";
import sharingRoutes from "./sharing.routes";
import socialRoutes from "./social.routes";
import storiesRoutes from "./stories.routes";
import subscriptionRoutes from "./subscription.routes";
import userRoutes from "./user.routes";
import configRoutes from "./config.routes";

const router = Router();

// router.get("/health", (_req, res) =>
//   res.json({ status: "ok", ts: new Date().toISOString() })
// );

router.use("/auth", authRoutes);
router.use("/bookmarks", bookmarksRoutes);
router.use("/categories", categoriesRoutes);
router.use("/communities", communitiesRoutes);
router.use("/discovery", discoveryRoutes);
router.use("/geospatial", geospatialRoutes);
router.use("/media", mediaRoutes);
router.use("/messaging", messagingRoutes);
router.use("/message-reactions", messageReactionsRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/user", userRoutes);
router.use("/moderation", moderationRoutes);
router.use("/mobile", mobileRoutes);
router.use("/posts", postsRoutes);
router.use("/social", socialRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/presence", presenceRoutes);
router.use("/search", searchRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/stories", storiesRoutes);
router.use("/sharing", sharingRoutes);
router.use("/config", configRoutes);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

export default router;
