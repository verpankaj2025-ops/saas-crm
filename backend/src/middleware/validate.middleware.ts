import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../lib/errors";

type ValidateTarget = "body" | "query" | "params";

/**
 * Factory that returns an Express middleware which validates req[target]
 * against a Zod schema and replaces it with the parsed (coerced) value.
 *
 * Usage:
 *   router.post("/", validate(CreateContactSchema), contactsController.create)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formatted = (result.error as ZodError).flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return next(new ValidationError("Validation failed", formatted));
    }

    req[target] = result.data;
    next();
  };
}
