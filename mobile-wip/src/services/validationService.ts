/**
 * Validation Service
 * Input validation, schema validation, and data sanitization
 */

export interface ValidationRule {
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, data?: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
  sanitizedValue?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface SanitizationOptions {
  trim?: boolean;
  toLowerCase?: boolean;
  removeSpecialChars?: boolean;
  allowedChars?: string;
  maxLength?: number;
}

// Mock File interface for React Native environment
interface File {
  name: string;
  type: string;
  size: number;
}

// File validation options interface
export interface FileValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

class ValidationService {
  // Common validation patterns
  private static readonly PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    username: /^[a-zA-Z0-9_]{3,20}$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    zipCode: /^\d{5}(-\d{4})?$/,
    creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^\d{2}:\d{2}(:\d{2})?$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    numeric: /^\d+$/,
    decimal: /^\d*\.?\d+$/,
  };

  // Common validation messages
  private static readonly MESSAGES = {
    required: "This field is required",
    email: "Please enter a valid email address",
    phone: "Please enter a valid phone number",
    password:
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number",
    username:
      "Username must be 3-20 characters and contain only letters, numbers, and underscores",
    url: "Please enter a valid URL",
    min: "Value must be at least {min}",
    max: "Value must be at most {max}",
    minLength: "Must be at least {min} characters",
    maxLength: "Must be at most {max} characters",
    pattern: "Invalid format",
    numeric: "Must be a number",
    integer: "Must be a whole number",
    positive: "Must be a positive number",
    date: "Please enter a valid date",
    time: "Please enter a valid time",
  };

  /**
   * Validate data against schema
   */
  public validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedData: any = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldRules = Array.isArray(rules) ? rules : [rules];

      let fieldValid = true;
      let sanitizedValue = value;

      for (const rule of fieldRules) {
        const validation = this.validateField(field, value, rule, data);

        if (!validation.isValid) {
          errors.push(...validation.errors);
          fieldValid = false;
        }

        if (validation.sanitizedValue !== undefined) {
          sanitizedValue = validation.sanitizedValue;
        }
      }

      if (fieldValid || sanitizedValue !== undefined) {
        sanitizedData[field] = sanitizedValue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData,
    };
  }

  /**
   * Validate single field against rule
   */
  public validateField(
    field: string,
    value: any,
    rule: ValidationRule,
    data?: any
  ): ValidationResult {
    const errors: ValidationError[] = [];
    let sanitizedValue = value;

    // Check required
    if (rule.required && this.isEmpty(value)) {
      errors.push({
        field,
        message: rule.message || ValidationService.MESSAGES.required,
        value,
        rule: "required",
      });
      return { isValid: false, errors };
    }

    // Skip validation for empty optional fields
    if (!rule.required && this.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    // Type validation
    const typeValidation = this.validateType(field, value, rule);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
    }
    if (typeValidation.sanitizedValue !== undefined) {
      sanitizedValue = typeValidation.sanitizedValue;
    }

    // Length/size validation
    if (rule.min !== undefined || rule.max !== undefined) {
      const sizeValidation = this.validateSize(field, sanitizedValue, rule);
      if (!sizeValidation.isValid) {
        errors.push(...sizeValidation.errors);
      }
    }

    // Pattern validation
    if (rule.pattern) {
      const patternValidation = this.validatePattern(
        field,
        sanitizedValue,
        rule
      );
      if (!patternValidation.isValid) {
        errors.push(...patternValidation.errors);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customValidation = this.validateCustom(
        field,
        sanitizedValue,
        rule,
        data
      );
      if (!customValidation.isValid) {
        errors.push(...customValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  /**
   * Validate type
   */
  private validateType(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];
    let sanitizedValue = value;

    switch (rule.type) {
      case "email":
        if (typeof value === "string") {
          sanitizedValue = value.trim().toLowerCase();
          if (!ValidationService.PATTERNS.email.test(sanitizedValue)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.email,
              value,
              rule: "email",
            });
          }
        } else {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.email,
            value,
            rule: "email",
          });
        }
        break;

      case "phone":
        if (typeof value === "string") {
          sanitizedValue = value.replace(/[\s\-\(\)]/g, "");
          if (!ValidationService.PATTERNS.phone.test(value)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.phone,
              value,
              rule: "phone",
            });
          }
        } else {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.phone,
            value,
            rule: "phone",
          });
        }
        break;

      case "password":
        if (typeof value === "string") {
          if (!ValidationService.PATTERNS.password.test(value)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.password,
              value: "[REDACTED]",
              rule: "password",
            });
          }
        } else {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.password,
            value: "[REDACTED]",
            rule: "password",
          });
        }
        break;

      case "username":
        if (typeof value === "string") {
          sanitizedValue = value.trim();
          if (!ValidationService.PATTERNS.username.test(sanitizedValue)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.username,
              value,
              rule: "username",
            });
          }
        } else {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.username,
            value,
            rule: "username",
          });
        }
        break;

      case "url":
        if (typeof value === "string") {
          sanitizedValue = value.trim();
          if (!ValidationService.PATTERNS.url.test(sanitizedValue)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.url,
              value,
              rule: "url",
            });
          }
        } else {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.url,
            value,
            rule: "url",
          });
        }
        break;

      case "number":
        const num = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(num)) {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.numeric,
            value,
            rule: "number",
          });
        } else {
          sanitizedValue = num;
        }
        break;

      case "integer":
        const int = typeof value === "string" ? parseInt(value, 10) : value;
        if (!Number.isInteger(int)) {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.integer,
            value,
            rule: "integer",
          });
        } else {
          sanitizedValue = int;
        }
        break;

      case "boolean":
        if (typeof value === "string") {
          sanitizedValue = value.toLowerCase() === "true";
        } else if (typeof value !== "boolean") {
          sanitizedValue = Boolean(value);
        }
        break;

      case "date":
        if (typeof value === "string") {
          if (!ValidationService.PATTERNS.date.test(value)) {
            errors.push({
              field,
              message: rule.message || ValidationService.MESSAGES.date,
              value,
              rule: "date",
            });
          } else {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              errors.push({
                field,
                message: rule.message || ValidationService.MESSAGES.date,
                value,
                rule: "date",
              });
            } else {
              sanitizedValue = date;
            }
          }
        } else if (!(value instanceof Date)) {
          errors.push({
            field,
            message: rule.message || ValidationService.MESSAGES.date,
            value,
            rule: "date",
          });
        }
        break;

      case "string":
        if (typeof value !== "string") {
          sanitizedValue = String(value);
        } else {
          sanitizedValue = value.trim();
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors.push({
            field,
            message: rule.message || "Must be an array",
            value,
            rule: "array",
          });
        }
        break;

      case "object":
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          errors.push({
            field,
            message: rule.message || "Must be an object",
            value,
            rule: "object",
          });
        }
        break;

      default:
        // Unknown type, skip validation
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  /**
   * Validate size/length constraints
   */
  private validateSize(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];
    let size: number;

    if (typeof value === "string" || Array.isArray(value)) {
      size = value.length;
    } else if (typeof value === "number") {
      size = value;
    } else {
      return { isValid: true, errors: [] };
    }

    if (rule.min !== undefined && size < rule.min) {
      const message =
        typeof value === "string" || Array.isArray(value)
          ? ValidationService.MESSAGES.minLength.replace(
              "{min}",
              rule.min.toString()
            )
          : ValidationService.MESSAGES.min.replace(
              "{min}",
              rule.min.toString()
            );

      errors.push({
        field,
        message: rule.message || message,
        value,
        rule: "min",
      });
    }

    if (rule.max !== undefined && size > rule.max) {
      const message =
        typeof value === "string" || Array.isArray(value)
          ? ValidationService.MESSAGES.maxLength.replace(
              "{max}",
              rule.max.toString()
            )
          : ValidationService.MESSAGES.max.replace(
              "{max}",
              rule.max.toString()
            );

      errors.push({
        field,
        message: rule.message || message,
        value,
        rule: "max",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate pattern
   */
  private validatePattern(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof value === "string" && rule.pattern) {
      if (!rule.pattern.test(value)) {
        errors.push({
          field,
          message: rule.message || ValidationService.MESSAGES.pattern,
          value,
          rule: "pattern",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate custom rule
   */
  private validateCustom(
    field: string,
    value: any,
    rule: ValidationRule,
    data?: any
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (rule.custom) {
      const result = rule.custom(value, data);
      if (result !== true) {
        const message =
          typeof result === "string"
            ? result
            : rule.message || "Validation failed";
        errors.push({
          field,
          message,
          value,
          rule: "custom",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Sanitize string value
   */
  public sanitizeString(
    value: string,
    options: SanitizationOptions = {}
  ): string {
    let sanitized = value;

    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, "");
    }

    if (options.allowedChars) {
      const pattern = new RegExp(
        `[^${options.allowedChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
        "g"
      );
      sanitized = sanitized.replace(pattern, "");
    }

    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Get predefined validation schema for common forms
   */
  public getSchema(schemaType: string): ValidationSchema {
    switch (schemaType) {
      case "login":
        return {
          email: { type: "email", required: true },
          password: { type: "string", required: true, min: 1 },
        };

      case "register":
        return {
          username: { type: "username", required: true },
          email: { type: "email", required: true },
          password: { type: "password", required: true },
          confirmPassword: {
            type: "string",
            required: true,
            custom: (value, data) =>
              data?.password === value || "Passwords do not match",
          },
        };

      case "profile":
        return {
          displayName: { type: "string", required: true, min: 2, max: 50 },
          bio: { type: "string", required: false, max: 500 },
          birthDate: { type: "date", required: true },
          phoneNumber: { type: "phone", required: false },
        };

      case "message":
        return {
          content: { type: "string", required: true, min: 1, max: 1000 },
        };

      case "search":
        return {
          query: { type: "string", required: true, min: 1, max: 100 },
          filters: { type: "object", required: false },
        };

      default:
        return {};
    }
  }

  /**
   * Validate password strength
   */
  public validatePasswordStrength(password: string): {
    score: number; // 0-4
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("Use at least 8 characters");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Add uppercase letters");

    if (/\d/.test(password)) score++;
    else feedback.push("Add numbers");

    if (/[^a-zA-Z\d]/.test(password)) score++;
    else feedback.push("Add special characters");

    return {
      score,
      feedback,
      isStrong: score >= 4,
    };
  }

  /**
   * Create validation rule builder
   */
  public rule(type: string): ValidationRuleBuilder {
    return new ValidationRuleBuilder(type);
  }
}

/**
 * Validation Rule Builder for fluent API
 */
class ValidationRuleBuilder {
  private rule: ValidationRule;

  constructor(type: string) {
    this.rule = { type };
  }

  required(message?: string): ValidationRuleBuilder {
    this.rule.required = true;
    if (message) this.rule.message = message;
    return this;
  }

  min(value: number, message?: string): ValidationRuleBuilder {
    this.rule.min = value;
    if (message) this.rule.message = message;
    return this;
  }

  max(value: number, message?: string): ValidationRuleBuilder {
    this.rule.max = value;
    if (message) this.rule.message = message;
    return this;
  }

  pattern(regex: RegExp, message?: string): ValidationRuleBuilder {
    this.rule.pattern = regex;
    if (message) this.rule.message = message;
    return this;
  }

  custom(
    validator: (value: any, data?: any) => boolean | string,
    message?: string
  ): ValidationRuleBuilder {
    this.rule.custom = validator;
    if (message) this.rule.message = message;
    return this;
  }

  message(text: string): ValidationRuleBuilder {
    this.rule.message = text;
    return this;
  }

  build(): ValidationRule {
    return this.rule;
  }
}

// Export singleton instance
export const validationService = new ValidationService();
export default validationService;
