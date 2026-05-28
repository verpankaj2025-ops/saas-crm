"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
const supabase_1 = require("../config/supabase");
const errors_1 = require("../lib/errors");
/**
 * Validates the workspace from req.params.workspaceId or req.user.workspaceId.
 * Ensures the authenticated user is a member of the requested workspace.
 * Attaches req.workspaceId for downstream use.
 *
 * Place AFTER authMiddleware in the middleware chain.
 */
async function tenantMiddleware(req, _res, next) {
    try {
        const workspaceId = req.params.workspaceId ?? req.user?.workspaceId;
        if (!workspaceId) {
            return next(new errors_1.ForbiddenError("Workspace context is required"));
        }
        const { data: membership, error } = await supabase_1.db
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", req.user.sub)
            .single();
        if (error || !membership) {
            return next(new errors_1.NotFoundError("Workspace"));
        }
        req.workspaceId = workspaceId;
        req.user.role = membership.role;
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=tenant.middleware.js.map