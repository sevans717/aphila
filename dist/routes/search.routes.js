"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const search_service_1 = require("../services/search.service");
const router = (0, express_1.Router)();
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        const userId = req.user.userId;
        const result = await search_service_1.SearchService.searchAll(userId, q);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});
router.get('/posts', auth_1.auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        const { cursor, limit } = req.query;
        const userId = req.user.userId;
        const result = await search_service_1.SearchService.searchPosts(userId, q, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Post search failed' });
    }
});
router.get('/users', auth_1.auth, async (req, res) => {
    try {
        const q = req.query.q || '';
        const { cursor, limit } = req.query;
        const userId = req.user.userId;
        const result = await search_service_1.SearchService.searchUsers(userId, q, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'User search failed' });
    }
});
router.get('/history', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const history = await search_service_1.SearchService.getSearchHistory(userId);
        res.json({ success: true, data: history });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to get search history' });
    }
});
router.delete('/history', auth_1.auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await search_service_1.SearchService.clearSearchHistory(userId);
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to clear search history' });
    }
});
exports.default = router;
//# sourceMappingURL=search.routes.js.map