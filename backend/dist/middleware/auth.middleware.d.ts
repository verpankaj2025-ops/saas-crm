import type { Request, Response, NextFunction } from "express";
/**
 * Verifies JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.user
 */
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map