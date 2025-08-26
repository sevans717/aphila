"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const user_schema_1 = require("../schemas/user.schema");
const user_service_1 = require("../services/user.service");
const router = (0, express_1.Router)();
// PATCH /user - update profile (requires auth)
router.patch("/", auth_1.requireAuth, (0, validation_1.validateBody)(user_schema_1.updateProfileSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        const profile = await (0, user_service_1.updateUserProfile)(userId, data);
        res.json({ success: true, data: profile });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map