"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middleware/validate");
const auth_schema_1 = require("../schemas/auth.schema");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validate)(auth_schema_1.registerSchema), auth_controller_1.registerHandler);
router.post('/login', (0, validate_1.validate)(auth_schema_1.loginSchema), auth_controller_1.loginHandler);
exports.default = router;
//# sourceMappingURL=auth.js.map