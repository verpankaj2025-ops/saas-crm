import type { UUID, Timestamps } from "../../types/common";

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  is_active: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;      // seconds
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  workspace_name: string;  // Creates a new workspace on register
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  workspaceId: string;
  role: string;
}

/** Shape stored in Redis for refresh token tracking */
export interface RefreshTokenRecord {
  userId: UUID;
  workspaceId: UUID;
  role: string;
  createdAt: string;
  family: string;         // Rotation family — detect token reuse attacks
}
