import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { SocialService } from '../services/social.service';
import { validateRequest, commonValidation } from '../middleware/validate';

const router = Router();

// Comments
const createCommentValidation = {
  body: z.object({
    content: z.string().min(1).max(1000),
    parentCommentId: commonValidation.uuid.optional(),
  }),
};

router.post('/posts/:postId/comments', auth, validateRequest(createCommentValidation), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const comment = await SocialService.createComment(userId, { postId: req.params.postId, content: req.body.content, parentId: req.body.parentCommentId });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
});

router.get('/posts/:postId/comments', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const comments = await SocialService.getPostComments(req.params.postId, (req.user as any).userId, limit);
    res.json({ success: true, data: { comments } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

router.get('/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const result = await SocialService.getCommentReplies(req.params.commentId, limit, offset);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch replies' });
  }
});

// Likes
const toggleLikeValidation = {
  body: z.object({
    type: z.enum(['post', 'comment']).optional(),
  }),
};

router.post('/posts/:postId/likes/toggle', auth, validateRequest(toggleLikeValidation), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const result = await SocialService.togglePostLike(req.params.postId, userId, req.body.type);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

router.post('/comments/:commentId/likes/toggle', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const result = await SocialService.toggleCommentLike(req.params.commentId, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
});

export default router;
