import { Router } from 'express';
import { auth } from '../middleware/auth';
import { SearchService } from '../services/search.service';

const router = Router();

router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = (req.user as any).userId;
    const result = await SearchService.searchAll(userId, q);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

router.get('/posts', auth, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const { cursor, limit } = req.query as any;
    const userId = (req.user as any).userId;
    const result = await SearchService.searchPosts(userId, q, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Post search failed' });
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const { cursor, limit } = req.query as any;
    const userId = (req.user as any).userId;
    const result = await SearchService.searchUsers(userId, q, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'User search failed' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const history = await SearchService.getSearchHistory(userId);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get search history' });
  }
});

router.delete('/history', auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const result = await SearchService.clearSearchHistory(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear search history' });
  }
});

export default router;
