import type { TokenPayload } from "../lib/jwt";

/**
 * Augment Express Request with CRM-specific properties set by middleware.
 */
declare global {
  namespace Express {
    interface Request {
      /** Authenticated user from JWT — set by authMiddleware */
      user: TokenPayload;
      /** Active workspace ID — validated by tenantMiddleware */
      workspaceId: string;
      /** Raw request body bytes captured by express.json verify — used for webhook HMAC checks */
      rawBody?: Buffer;
    }
  }
}

export {};
