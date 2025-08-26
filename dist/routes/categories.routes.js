"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const category_service_1 = require("../services/category.service");
const router = (0, express_1.Router)();
// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await category_service_1.CategoryService.getAllCategories();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Get category by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await category_service_1.CategoryService.getCategoryBySlug(slug);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});
// Join category
router.post('/:categoryId/join', auth_1.requireAuth, (0, validate_1.validateRequest)({ params: undefined }), async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user.userId;
        const membership = await category_service_1.CategoryService.joinCategory(userId, categoryId);
        res.status(201).json(membership);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to join category' });
    }
});
// Leave category
router.delete('/:categoryId/leave', auth_1.requireAuth, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user.userId;
        await category_service_1.CategoryService.leaveCategory(userId, categoryId);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to leave category' });
    }
});
// Get user's categories
router.get('/user/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const categories = await category_service_1.CategoryService.getUserCategories(userId);
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user categories' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.routes.js.map