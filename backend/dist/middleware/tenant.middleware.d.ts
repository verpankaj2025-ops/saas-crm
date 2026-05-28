import type { Request, Response, NextFunction } from "express";
/**
 * Validates the workspace from req.params.workspaceId or req.user.workspaceId.
 * Ensures the authenticated user is a member of the requested workspace.
 * Attaches req.workspaceId for downstream use.
 *
 * Place AFTER authMiddleware in the middleware chain.
 */
export declare function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=tenant.middleware.d.ts.map