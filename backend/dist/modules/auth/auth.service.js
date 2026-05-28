"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const auth_repository_1 = require("./auth.repository");
const jwt_1 = require("../../lib/jwt");
const errors_1 = require("../../lib/errors");
const BCRYPT_ROUNDS = 12;
const buildTokens = (userId, workspaceId, role) => ({
    accessToken: (0, jwt_1.signAccessToken)({ sub: userId, workspaceId, role }),
    refreshToken: (0, jwt_1.signRefreshToken)({ sub: userId, workspaceId, role }),
    expiresIn: 15 * 60,
});
exports.authService = {
    async register(dto) {
        const existing = await auth_repository_1.authRepository.findUserByEmail(dto.email);
        if (existing)
            throw new errors_1.ConflictError("Email already in use");
        const password_hash = await bcryptjs_1.default.hash(dto.password, BCRYPT_ROUNDS);
        const user = await auth_repository_1.authRepository.createUser({
            email: dto.email,
            full_name: dto.full_name,
            password_hash,
        });
        const workspace = await auth_repository_1.authRepository.createWorkspace(dto.workspace_name, user.id);
        await auth_repository_1.authRepository.addWorkspaceMember(workspace.id, user.id, "owner");
        const tokens = buildTokens(user.id, workspace.id, "owner");
        await auth_repository_1.authRepository.saveRefreshToken(tokens.refreshToken, {
            userId: user.id,
            workspaceId: workspace.id,
            role: "owner",
            createdAt: new Date().toISOString(),
            family: crypto_1.default.randomUUID(),
        });
        return { user, tokens, workspaceId: workspace.id, role: "owner" };
    },
    async login(dto) {
        const user = await auth_repository_1.authRepository.findUserByEmail(dto.email);
        // Constant-time: always run bcrypt even when user not found (prevents timing attacks)
        const dummyHash = "$2b$12$invalidhashfortimingattackprevention000000000000000000";
        const storedHash = user ? (await auth_repository_1.authRepository.getUserPasswordHash(user.id) ?? dummyHash) : dummyHash;
        const valid = await bcryptjs_1.default.compare(dto.password, storedHash);
        if (!user || !valid)
            throw new errors_1.UnauthorizedError("Invalid email or password");
        if (!user.is_active)
            throw new errors_1.UnauthorizedError("Account is inactive");
        const workspace = await auth_repository_1.authRepository.findPrimaryWorkspace(user.id);
        if (!workspace)
            throw new errors_1.UnauthorizedError("No workspace found");
        const tokens = buildTokens(user.id, workspace.workspaceId, workspace.role);
        await auth_repository_1.authRepository.saveRefreshToken(tokens.refreshToken, {
            userId: user.id,
            workspaceId: workspace.workspaceId,
            role: workspace.role,
            createdAt: new Date().toISOString(),
            family: crypto_1.default.randomUUID(),
        });
        return { user, tokens, workspaceId: workspace.workspaceId, role: workspace.role };
    },
    async refresh(refreshToken) {
        const record = await auth_repository_1.authRepository.getRefreshToken(refreshToken);
        if (!record)
            throw new errors_1.UnauthorizedError("Invalid or expired refresh token");
        try {
            (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            // Possible token reuse attack — invalidate this token
            await auth_repository_1.authRepository.deleteRefreshToken(refreshToken);
            throw new errors_1.UnauthorizedError("Refresh token invalid or expired");
        }
        // Rotate: invalidate old token, issue new pair
        await auth_repository_1.authRepository.deleteRefreshToken(refreshToken);
        const user = await auth_repository_1.authRepository.findUserById(record.userId);
        if (!user)
            throw new errors_1.NotFoundError("User");
        if (!user.is_active)
            throw new errors_1.UnauthorizedError("Account is inactive");
        const tokens = buildTokens(record.userId, record.workspaceId, record.role);
        await auth_repository_1.authRepository.saveRefreshToken(tokens.refreshToken, {
            ...record,
            createdAt: new Date().toISOString(),
        });
        return { user, tokens, workspaceId: record.workspaceId, role: record.role };
    },
    async logout(refreshToken) {
        await auth_repository_1.authRepository.deleteRefreshToken(refreshToken);
    },
};
//# sourceMappingURL=auth.service.js.map