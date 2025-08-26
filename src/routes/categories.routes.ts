import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { CategoryService } from '../services/category.service';

const router = Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await CategoryService.getCategoryBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Join category
router.post('/:categoryId/join', requireAuth, validateRequest({ params: undefined }), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user!.userId;
    
    const membership = await CategoryService.joinCategory(userId, categoryId);
    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join category' });
  }
});

// Leave category
router.delete('/:categoryId/leave', requireAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user!.userId;
    
    await CategoryService.leaveCategory(userId, categoryId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave category' });
  }
});

// Get user's categories
router.get('/user/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const categories = await CategoryService.getUserCategories(userId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user categories' });
  }
});

export default router;
