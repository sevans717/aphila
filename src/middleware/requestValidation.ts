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
      req.query = (parsed as any).query ?? (req.query as any);
      req.params = (parsed as any).params ?? (req.params as any);
      return next();
    } catch (err: any) {
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

export default validate;
