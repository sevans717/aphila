"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.updateUserProfile = updateUserProfile;
const bcrypt = __importStar(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
async function createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 12);
    return prisma_1.prisma.user.create({ data: { email, password: hashedPassword } });
}
async function findUserByEmail(email) {
    return prisma_1.prisma.user.findUnique({ where: { email } });
}
async function updateUserProfile(userId, data) {
    // update or create profile row
    const existing = await prisma_1.prisma.profile.findUnique({ where: { userId } });
    if (existing) {
        return prisma_1.prisma.profile.update({ where: { userId }, data });
    }
    return prisma_1.prisma.profile.create({
        data: {
            userId,
            displayName: data.displayName || "User",
            bio: data.bio || "",
            location: data.location || null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            birthdate: new Date("1990-01-01"),
            gender: "OTHER",
            orientation: "OTHER",
        },
    });
}
//# sourceMappingURL=user.service.js.map