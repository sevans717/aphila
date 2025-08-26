import { Router } from 'express';
import { z } from 'zod';
import { auth, requireAuth } from '../middleware/auth';
import { PostService } from '../services/post.service';

const router = Router();

// Validation schemas
const createPostSchema = { body: z.object({ content: z.string().min(1).max(10000).optional(), communityId: z.string().cuid().optional(), type: z.string().optional(), visibility: z.string().optional() }) };
const updatePostSchema = { body: z.object({ content: z.string().min(1).max(10000).optional(), isPinned: z.boolean().optional(), isArchived: z.boolean().optional() }) };

// Get a single post
router.get('/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = (req.user as any)?.userId;
    const post = await PostService.getPostById(postId, userId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
});

// Get feed
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const { cursor, limit } = req.query as any;
    const userId = (req.user as any).userId;
    const result = await PostService.getFeed(userId, { cursor: cursor as string | undefined, limit: limit ? parseInt(limit as string, 10) : undefined });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
});

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const post = await PostService.createPost({ authorId: userId, content: req.body.content, communityId: req.body.communityId, type: req.body.type, visibility: req.body.visibility });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// Update a post
router.patch('/:postId', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const updated = await PostService.updatePost(req.params.postId, userId, { content: req.body.content, isPinned: req.body.isPinned, isArchived: req.body.isArchived });
    if (!updated) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const ok = await PostService.deletePost(req.params.postId, userId);
    if (!ok) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

export default router;
