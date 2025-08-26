"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const auth_2 = __importDefault(require("./auth"));
const bookmarks_routes_1 = __importDefault(require("./bookmarks.routes"));
const categories_routes_1 = __importDefault(require("./categories.routes"));
const communities_routes_1 = __importDefault(require("./communities.routes"));
const discovery_routes_1 = __importDefault(require("./discovery.routes"));
const messaging_routes_1 = __importDefault(require("./messaging.routes"));
const mobile_routes_1 = __importDefault(require("./mobile.routes"));
const moderation_routes_1 = __importDefault(require("./moderation.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const posts_routes_1 = __importDefault(require("./posts.routes"));
const search_routes_1 = __importDefault(require("./search.routes"));
const sharing_routes_1 = __importDefault(require("./sharing.routes"));
const social_routes_1 = __importDefault(require("./social.routes"));
const stories_routes_1 = __importDefault(require("./stories.routes"));
const subscription_routes_1 = __importDefault(require("./subscription.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
router.use('/auth', auth_2.default);
router.use('/bookmarks', bookmarks_routes_1.default);
router.use('/categories', categories_routes_1.default);
router.use('/communities', communities_routes_1.default);
router.use('/discovery', discovery_routes_1.default);
router.use('/messaging', messaging_routes_1.default);
router.use('/subscription', subscription_routes_1.default);
router.use('/user', user_routes_1.default);
router.use('/moderation', moderation_routes_1.default);
router.use('/mobile', mobile_routes_1.default);
router.use('/posts', posts_routes_1.default);
router.use('/social', social_routes_1.default);
router.use('/notifications', notifications_routes_1.default);
router.use('/search', search_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
router.use('/stories', stories_routes_1.default);
router.use('/sharing', sharing_routes_1.default);
router.get('/me', auth_1.requireAuth, (req, res) => {
    // @ts-ignore
    res.json({ user: req.user });
});
exports.default = router;
//# sourceMappingURL=index.js.map