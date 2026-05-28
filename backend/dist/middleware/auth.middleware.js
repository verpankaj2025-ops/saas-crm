"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../lib/jwt");
const errors_1 = require("../lib/errors");
/**
 * Verifies JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.user
 */
function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new errors_1.UnauthorizedError("Missing or malformed Authorization header"));
    }
    const token = authHeader.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        req.workspaceId = payload.workspaceId;
        next();
    }
    catch {
        next(new errors_1.UnauthorizedError("Invalid or expired access token"));
    }
}
//# sourceMappingURL=auth.middleware.js.map