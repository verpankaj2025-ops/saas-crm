import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  sub: string;          // user_id (UUID)
  workspaceId: string;
  role: string;
  type: "access" | "refresh";
}

type PayloadInput = Omit<TokenPayload, "type">;

export const signAccessToken = (payload: PayloadInput): string =>
  jwt.sign(
    { ...payload, type: "access" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );

export const signRefreshToken = (payload: PayloadInput): string =>
  jwt.sign(
    { ...payload, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
