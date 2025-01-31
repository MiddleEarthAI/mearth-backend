import type { NextFunction, Request, Response } from "express";
import { ZodError, type AnyZodObject } from "zod";

/**
 * Middleware to validate request using Zod schemas
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.errors,
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Internal server error during validation",
        });
      }
    }
  };
};
