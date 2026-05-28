import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
type ValidateTarget = "body" | "query" | "params";
/**
 * Factory that returns an Express middleware which validates req[target]
 * against a Zod schema and replaces it with the parsed (coerced) value.
 *
 * Usage:
 *   router.post("/", validate(CreateContactSchema), contactsController.create)
 */
export declare function validate(schema: ZodSchema, target?: ValidateTarget): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.middleware.d.ts.map