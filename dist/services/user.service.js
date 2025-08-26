"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.updateUserProfile = updateUserProfile;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
async function createUser(email, password) {
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
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
    return prisma_1.prisma.profile.create({ data: { userId, displayName: data.displayName || 'User', bio: data.bio || '', location: data.location || null, latitude: data.latitude ?? null, longitude: data.longitude ?? null, birthdate: new Date('1990-01-01'), gender: 'OTHER', orientation: 'OTHER' } });
}
//# sourceMappingURL=user.service.js.map