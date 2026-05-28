"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const auth_validation_1 = require("./auth.validation");
exports.authRouter = (0, express_1.Router)();
// Public — rate-limited
exports.authRouter.post("/register", rate_limit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validation_1.RegisterSchema), auth_controller_1.authController.register);
exports.authRouter.post("/login", rate_limit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validation_1.LoginSchema), auth_controller_1.authController.login);
// Refresh reads token from httpOnly cookie (no body validation needed)
exports.authRouter.post("/refresh", rate_limit_middleware_1.authLimiter, auth_controller_1.authController.refresh);
// Protected
exports.authRouter.post("/logout", auth_middleware_1.authMiddleware, auth_controller_1.authController.logout);
exports.authRouter.get("/me", auth_middleware_1.authMiddleware, auth_controller_1.authController.me);
//# sourceMappingURL=auth.routes.js.map