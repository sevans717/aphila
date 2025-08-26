import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth';
import bookmarksRoutes from './bookmarks.routes';
import categoriesRoutes from './categories.routes';
import communitiesRoutes from './communities.routes';
import discoveryRoutes from './discovery.routes';
import messagingRoutes from './messaging.routes';
import mobileRoutes from './mobile.routes';
import moderationRoutes from './moderation.routes';
import notificationsRoutes from './notifications.routes';
import postsRoutes from './posts.routes';
import searchRoutes from './search.routes';
import sharingRoutes from './sharing.routes';
import socialRoutes from './social.routes';
import storiesRoutes from './stories.routes';
import subscriptionRoutes from './subscription.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/bookmarks', bookmarksRoutes);
router.use('/categories', categoriesRoutes);
router.use('/communities', communitiesRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/messaging', messagingRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/moderation', moderationRoutes);
router.use('/mobile', mobileRoutes);
router.use('/posts', postsRoutes);
router.use('/social', socialRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/stories', storiesRoutes);
router.use('/sharing', sharingRoutes);

router.get('/me', requireAuth, (req, res) => {
  // @ts-ignore
  res.json({ user: req.user });
});

export default router;
