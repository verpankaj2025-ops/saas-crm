import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { UnauthorizedError } from "../lib/errors";

/**
 * Verifies JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.user
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or malformed Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.workspaceId = payload.workspaceId;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
