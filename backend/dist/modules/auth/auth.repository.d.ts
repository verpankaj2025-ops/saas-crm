import type { UUID } from "../../types/common";
import type { User, RefreshTokenRecord } from "./auth.types";
export declare const authRepository: {
    findUserByEmail(email: string): Promise<User | null>;
    createUser(payload: {
        email: string;
        full_name: string;
        password_hash: string;
    }): Promise<User>;
    createWorkspace(name: string, ownerId: UUID): Promise<{
        id: UUID;
    }>;
    addWorkspaceMember(workspaceId: UUID, userId: UUID, role?: string): Promise<void>;
    saveRefreshToken(token: string, record: RefreshTokenRecord): Promise<void>;
    getRefreshToken(token: string): Promise<RefreshTokenRecord | null>;
    deleteRefreshToken(token: string): Promise<void>;
    getUserPasswordHash(userId: UUID): Promise<string | null>;
    findUserById(id: UUID): Promise<User | null>;
    findPrimaryWorkspace(userId: UUID): Promise<{
        workspaceId: UUID;
        role: string;
    } | null>;
};
//# sourceMappingURL=auth.repository.d.ts.map