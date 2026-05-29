import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError, isAppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, path: req.path });
    }

    const body: Record<string, unknown> = {
      success: false,
      error:   err.message,
      code:    err.code,
    };

    // Include per-field details for validation failures so clients
    // can map errors back to form fields without a second round-trip.
    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Unhandled / unknown error
  logger.error("Unhandled error", {
    err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
