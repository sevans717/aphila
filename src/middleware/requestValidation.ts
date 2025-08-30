import { ZodObject, ZodRawShape } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // merge parsed values back to request to keep types predictable
      req.body = (parsed as any).body ?? req.body;
      // Don't modify req.query as it's read-only in newer Node.js versions
      // Instead, store validated query separately if needed
      if ((parsed as any).query) {
        (req as any).validatedQuery = (parsed as any).query;
      }
      req.params = (parsed as any).params ?? (req.params as any);
      return next();
    } catch (err: any) {
      const issues = err?.errors ?? [
        { message: err?.message ?? "Invalid request" },
      ];
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: issues,
      });
    }
  };

export default validate;
