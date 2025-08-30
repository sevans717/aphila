"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PASSWORD_REQUIREMENTS = void 0;
exports.validatePasswordStrength = validatePasswordStrength;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateSecurePassword = generateSecurePassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../config/env");
/**
 * Default password requirements
 */
exports.DEFAULT_PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
};
/**
 * Validates password strength
 */
function validatePasswordStrength(password, requirements = exports.DEFAULT_PASSWORD_REQUIREMENTS) {
    const errors = [];
    if (password.length < requirements.minLength) {
        errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (requirements.requireNumbers && !/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (requirements.requireSpecialChars &&
        !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    // Check for common weak passwords
    const commonPasswords = [
        "password",
        "123456",
        "password123",
        "admin",
        "letmein",
        "qwerty",
        "monkey",
        "dragon",
        "baseball",
        "football",
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("Password is too common");
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Hashes a password with bcrypt
 */
async function hashPassword(password) {
    const saltRounds = env_1.env.bcryptRounds || 12;
    return await bcrypt_1.default.hash(password, saltRounds);
}
/**
 * Verifies a password against its hash
 */
async function verifyPassword(password, hash) {
    return await bcrypt_1.default.compare(password, hash);
}
/**
 * Generates a secure random password
 */
function generateSecurePassword(length = 12) {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    // Fill the rest randomly
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    // Shuffle the password
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
}
exports.default = {
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    generateSecurePassword,
    DEFAULT_PASSWORD_REQUIREMENTS: exports.DEFAULT_PASSWORD_REQUIREMENTS,
};
//# sourceMappingURL=password.js.map