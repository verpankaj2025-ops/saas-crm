import type { Request, Response, NextFunction } from "express";
import { db } from "../config/supabase";
import { ForbiddenError, NotFoundError } from "../lib/errors";

/**
 * Validates the workspace from req.params.workspaceId or req.user.workspaceId.
 * Ensures the authenticated user is a member of the requested workspace.
 * Attaches req.workspaceId for downstream use.
 *
 * Place AFTER authMiddleware in the middleware chain.
 */
export async function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const workspaceId = req.params.workspaceId ?? req.user?.workspaceId;

    if (!workspaceId) {
      return next(new ForbiddenError("Workspace context is required"));
    }

    const { data: membership, error } = await db
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", req.user.sub)
      .single();

    if (error || !membership) {
      return next(new NotFoundError("Workspace"));
    }

    req.workspaceId = workspaceId;
    req.user.role = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}
