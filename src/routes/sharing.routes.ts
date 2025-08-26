import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { SharingService } from '../services/sharing.service';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const sharePostValidation = {
  body: z.object({
    postId: z.string(),
    platform: z.string().optional(),
    comment: z.string().optional()
  })
};

const shareMediaValidation = {
  body: z.object({
    mediaId: z.string(),
    platform: z.string().optional(),
    comment: z.string().optional()
  })
};

// Share a post
router.post('/post', auth, validateRequest(sharePostValidation), async (req, res) => {
  try {
    const { postId, platform, comment } = req.body;
    const userId = req.user!.userId;

    const share = await SharingService.sharePost({
      userId,
      postId,
      platform,
      comment,
    });

    res.status(201).json({
      success: true,
      data: share
    });
  } catch (error) {
    logger.error('Error sharing post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share post'
    });
  }
});

// Share media
router.post('/media', auth, validateRequest(shareMediaValidation), async (req, res) => {
  try {
    const { mediaId, platform, comment } = req.body;
    const userId = req.user!.userId;

    const share = await SharingService.shareMedia({
      userId,
      mediaId,
      platform,
      comment,
    });

    res.status(201).json({
      success: true,
      data: share
    });
  } catch (error) {
    logger.error('Error sharing media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share media'
    });
  }
});

// Get user's shares
router.get('/my-shares', auth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit = 20 } = req.query;

    const shares = await SharingService.getUserShares(userId, parseInt(limit as string));

    res.json({
      success: true,
      data: shares
    });
  } catch (error) {
    logger.error('Error fetching user shares:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shares'
    });
  }
});

// Delete share
router.delete('/:shareId', auth, async (req, res) => {
  try {
    const { shareId } = req.params;
    const { type } = req.query; // 'post' | 'media'
    const userId = req.user!.userId;

    await SharingService.deleteShare(shareId, userId, type as 'post' | 'media');

    res.json({
      success: true,
      message: 'Share deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete share'
    });
  }
});

export default router;
