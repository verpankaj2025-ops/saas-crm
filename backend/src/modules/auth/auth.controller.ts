import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { sendSuccess, sendCreated, sendNoContent } from "../../lib/response";
import type { LoginInput, RegisterInput } from "./auth.validation";
import { env } from "../../config/env";

const COOKIE_NAME = "crm_rt";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,   // "none" + secure=true for cross-origin prod
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days ms
  path: "/",
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
}

function getRefreshToken(req: Request): string | undefined {
  return (req.cookies as Record<string, string>)[COOKIE_NAME] ?? (req.body as { refreshToken?: string })?.refreshToken;
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await authService.register(req.body as RegisterInput);
      setRefreshCookie(res, session.tokens.refreshToken);
      sendCreated(res, {
        user: session.user,
        accessToken: session.tokens.accessToken,
        expiresIn: session.tokens.expiresIn,
        workspaceId: session.workspaceId,
        role: session.role,
      });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await authService.login(req.body as LoginInput);
      setRefreshCookie(res, session.tokens.refreshToken);
      sendSuccess(res, {
        user: session.user,
        accessToken: session.tokens.accessToken,
        expiresIn: session.tokens.expiresIn,
        workspaceId: session.workspaceId,
        role: session.role,
      });
    } catch (err) { next(err); }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = getRefreshToken(req);
      if (!token) {
        res.status(401).json({ success: false, error: "No refresh token provided", code: "UNAUTHORIZED" });
        return;
      }
      const session = await authService.refresh(token);
      setRefreshCookie(res, session.tokens.refreshToken);
      sendSuccess(res, {
        user: session.user,
        accessToken: session.tokens.accessToken,
        expiresIn: session.tokens.expiresIn,
        workspaceId: session.workspaceId,
        role: session.role,
      });
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = getRefreshToken(req);
      if (token) await authService.logout(token);
      clearRefreshCookie(res);
      sendNoContent(res);
    } catch (err) { next(err); }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, req.user);
    } catch (err) { next(err); }
  },
};
