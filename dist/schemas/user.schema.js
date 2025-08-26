"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(64).optional(),
    bio: zod_1.z.string().max(1000).optional(),
    location: zod_1.z.string().max(255).optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
//# sourceMappingURL=user.schema.js.map