import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authLimiter } from "../../middleware/rate-limit.middleware";
import { validate } from "../../middleware/validate.middleware";
import { LoginSchema, RegisterSchema } from "./auth.validation";

export const authRouter = Router();

// Public — rate-limited
authRouter.post("/register", authLimiter, validate(RegisterSchema), authController.register);
authRouter.post("/login",    authLimiter, validate(LoginSchema),    authController.login);
// Refresh reads token from httpOnly cookie (no body validation needed)
authRouter.post("/refresh",  authLimiter, authController.refresh);

// Protected
authRouter.post("/logout", authMiddleware, authController.logout);
authRouter.get("/me",      authMiddleware, authController.me);
