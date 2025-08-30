/**
 * Password strength requirements
 */
export interface PasswordRequirements {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
}
/**
 * Default password requirements
 */
export declare const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements;
/**
 * Validates password strength
 */
export declare function validatePasswordStrength(password: string, requirements?: PasswordRequirements): {
    isValid: boolean;
    errors: string[];
};
/**
 * Hashes a password with bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifies a password against its hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generates a secure random password
 */
export declare function generateSecurePassword(length?: number): string;
declare const _default: {
    validatePasswordStrength: typeof validatePasswordStrength;
    hashPassword: typeof hashPassword;
    verifyPassword: typeof verifyPassword;
    generateSecurePassword: typeof generateSecurePassword;
    DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements;
};
export default _default;
//# sourceMappingURL=password.d.ts.map