import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authRepository } from "./auth.repository";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { UnauthorizedError, ConflictError, NotFoundError } from "../../lib/errors";
import type { LoginInput, RegisterInput } from "./auth.validation";
import type { AuthSession } from "./auth.types";

const BCRYPT_ROUNDS = 12;

const buildTokens = (userId: string, workspaceId: string, role: string) => ({
  accessToken: signAccessToken({ sub: userId, workspaceId, role }),
  refreshToken: signRefreshToken({ sub: userId, workspaceId, role }),
  expiresIn: 15 * 60,
});

export const authService = {
  async register(dto: RegisterInput): Promise<AuthSession> {
    const existing = await authRepository.findUserByEmail(dto.email);
    if (existing) throw new ConflictError("Email already in use");

    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await authRepository.createUser({
      email: dto.email,
      full_name: dto.full_name,
      password_hash,
    });

    const workspace = await authRepository.createWorkspace(dto.workspace_name, user.id);
    await authRepository.addWorkspaceMember(workspace.id, user.id, "owner");

    const tokens = buildTokens(user.id, workspace.id, "owner");
    await authRepository.saveRefreshToken(tokens.refreshToken, {
      userId: user.id,
      workspaceId: workspace.id,
      role: "owner",
      createdAt: new Date().toISOString(),
      family: crypto.randomUUID(),
    });

    return { user, tokens, workspaceId: workspace.id, role: "owner" };
  },

  async login(dto: LoginInput): Promise<AuthSession> {
    const user = await authRepository.findUserByEmail(dto.email);
    // Constant-time: always run bcrypt even when user not found (prevents timing attacks)
    const dummyHash = "$2b$12$invalidhashfortimingattackprevention000000000000000000";
    const storedHash = user ? (await authRepository.getUserPasswordHash(user.id) ?? dummyHash) : dummyHash;

    const valid = await bcrypt.compare(dto.password, storedHash);
    if (!user || !valid) throw new UnauthorizedError("Invalid email or password");
    if (!user.is_active) throw new UnauthorizedError("Account is inactive");

    const workspace = await authRepository.findPrimaryWorkspace(user.id);
    if (!workspace) throw new UnauthorizedError("No workspace found");

    const tokens = buildTokens(user.id, workspace.workspaceId, workspace.role);
    await authRepository.saveRefreshToken(tokens.refreshToken, {
      userId: user.id,
      workspaceId: workspace.workspaceId,
      role: workspace.role,
      createdAt: new Date().toISOString(),
      family: crypto.randomUUID(),
    });

    return { user, tokens, workspaceId: workspace.workspaceId, role: workspace.role };
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const record = await authRepository.getRefreshToken(refreshToken);
    if (!record) throw new UnauthorizedError("Invalid or expired refresh token");

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      // Possible token reuse attack — invalidate this token
      await authRepository.deleteRefreshToken(refreshToken);
      throw new UnauthorizedError("Refresh token invalid or expired");
    }

    // Rotate: invalidate old token, issue new pair
    await authRepository.deleteRefreshToken(refreshToken);

    const user = await authRepository.findUserById(record.userId);
    if (!user) throw new NotFoundError("User");
    if (!user.is_active) throw new UnauthorizedError("Account is inactive");

    const tokens = buildTokens(record.userId, record.workspaceId, record.role);
    await authRepository.saveRefreshToken(tokens.refreshToken, {
      ...record,
      createdAt: new Date().toISOString(),
    });

    return { user, tokens, workspaceId: record.workspaceId, role: record.role };
  },

  async logout(refreshToken: string): Promise<void> {
    await authRepository.deleteRefreshToken(refreshToken);
  },
};
