"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
async function createUser(email, password) {
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    return prisma_1.prisma.user.create({ data: { email, password: hashedPassword } });
}
async function findUserByEmail(email) {
    return prisma_1.prisma.user.findUnique({ where: { email } });
}
//# sourceMappingURL=user.service.js.map