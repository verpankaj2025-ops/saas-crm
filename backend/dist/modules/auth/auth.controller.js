"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../lib/response");
const env_1 = require("../../config/env");
const COOKIE_NAME = "crm_rt";
const COOKIE_OPTS = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === "production",
    sameSite: "lax", // "none" + secure=true for cross-origin prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days ms
    path: "/",
};
function setRefreshCookie(res, token) {
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}
function clearRefreshCookie(res) {
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
}
function getRefreshToken(req) {
    return req.cookies[COOKIE_NAME] ?? req.body?.refreshToken;
}
exports.authController = {
    async register(req, res, next) {
        try {
            const session = await auth_service_1.authService.register(req.body);
            setRefreshCookie(res, session.tokens.refreshToken);
            (0, response_1.sendCreated)(res, {
                user: session.user,
                accessToken: session.tokens.accessToken,
                expiresIn: session.tokens.expiresIn,
                workspaceId: session.workspaceId,
                role: session.role,
            });
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const session = await auth_service_1.authService.login(req.body);
            setRefreshCookie(res, session.tokens.refreshToken);
            (0, response_1.sendSuccess)(res, {
                user: session.user,
                accessToken: session.tokens.accessToken,
                expiresIn: session.tokens.expiresIn,
                workspaceId: session.workspaceId,
                role: session.role,
            });
        }
        catch (err) {
            next(err);
        }
    },
    async refresh(req, res, next) {
        try {
            const token = getRefreshToken(req);
            if (!token) {
                res.status(401).json({ success: false, error: "No refresh token provided", code: "UNAUTHORIZED" });
                return;
            }
            const session = await auth_service_1.authService.refresh(token);
            setRefreshCookie(res, session.tokens.refreshToken);
            (0, response_1.sendSuccess)(res, {
                user: session.user,
                accessToken: session.tokens.accessToken,
                expiresIn: session.tokens.expiresIn,
                workspaceId: session.workspaceId,
                role: session.role,
            });
        }
        catch (err) {
            next(err);
        }
    },
    async logout(req, res, next) {
        try {
            const token = getRefreshToken(req);
            if (token)
                await auth_service_1.authService.logout(token);
            clearRefreshCookie(res);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    async me(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, req.user);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map