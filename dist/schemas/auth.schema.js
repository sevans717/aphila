"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(72),
});
exports.registerSchema = registerSchema;
const loginSchema = registerSchema;
exports.loginSchema = loginSchema;
//# sourceMappingURL=auth.schema.js.map