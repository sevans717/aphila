import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { BookmarkService } from '../services/bookmark.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createCollectionValidation = {
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    isPublic: z.boolean().default(false)
  })
};

// Collection routes
router.post('/collections', auth, validateRequest(createCollectionValidation), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const collection = await BookmarkService.createCollection({
      userId,
      name: req.body.name,
      description: req.body.description,
      isPublic: req.body.isPublic
    });
    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    logger.error('Error creating collection:', error);
    res.status(500).json({ success: false, message: 'Failed to create collection' });
  }
});

router.get('/collections', auth, async (req, res) => {
  try {
    const collections = await BookmarkService.getUserCollections(req.user!.userId);
    res.json({ success: true, data: collections });
  } catch (error) {
    logger.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
});

// Bookmark routes
router.post('/posts/:postId/toggle', auth, validateRequest({ params: z.object({ postId: z.string().min(1) }), body: z.object({ collectionId: z.string().optional() }) }), async (req, res) => {
  try {
    const result = await BookmarkService.togglePostBookmark(
      req.user!.userId,
      req.params.postId,
      req.body.collectionId || null
    );
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error toggling post bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
  }
});

router.post('/media/:mediaId/toggle', auth, validateRequest({ params: z.object({ mediaId: z.string().min(1) }) }), async (req, res) => {
  try {
    const result = await BookmarkService.toggleMediaBookmark(
      req.user!.userId,
      req.params.mediaId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error toggling media bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await BookmarkService.getBookmarkStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching bookmark stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmark stats' });
  }
});

export default router;
