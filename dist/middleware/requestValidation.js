"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // merge parsed values back to request to keep types predictable
        req.body = parsed.body ?? req.body;
        req.query = parsed.query ?? req.query;
        req.params = parsed.params ?? req.params;
        return next();
    }
    catch (err) {
        const issues = err?.errors ?? [
            { message: err?.message ?? "Invalid request" },
        ];
        return res
            .status(400)
            .json({
            success: false,
            message: "Validation failed",
            details: issues,
        });
    }
};
exports.validate = validate;
exports.default = exports.validate;
//# sourceMappingURL=requestValidation.js.map