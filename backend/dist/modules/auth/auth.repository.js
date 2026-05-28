"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const supabase_1 = require("../../config/supabase");
const redis_1 = require("../../config/redis");
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const refreshKey = (token) => `refresh_token:${token}`;
exports.authRepository = {
    async findUserByEmail(email) {
        const { data } = await supabase_1.db
            .from("users")
            .select("id, email, full_name, avatar_url, timezone, is_active")
            .eq("email", email.toLowerCase())
            .is("deleted_at", null)
            .single();
        return data ?? null;
    },
    async createUser(payload) {
        const { data, error } = await supabase_1.db
            .from("users")
            .insert({ ...payload, email: payload.email.toLowerCase() })
            .select("id, email, full_name, avatar_url, timezone, is_active")
            .single();
        if (error)
            throw error;
        return data;
    },
    async createWorkspace(name, ownerId) {
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const { data, error } = await supabase_1.db
            .from("workspaces")
            .insert({ name, slug, owner_id: ownerId })
            .select("id")
            .single();
        if (error)
            throw error;
        return data;
    },
    async addWorkspaceMember(workspaceId, userId, role = "owner") {
        await supabase_1.db.from("workspace_members").insert({ workspace_id: workspaceId, user_id: userId, role });
    },
    async saveRefreshToken(token, record) {
        await redis_1.redis.setex(refreshKey(token), REFRESH_TOKEN_TTL, JSON.stringify(record));
    },
    async getRefreshToken(token) {
        const raw = await redis_1.redis.get(refreshKey(token));
        return raw ? JSON.parse(raw) : null;
    },
    async deleteRefreshToken(token) {
        await redis_1.redis.del(refreshKey(token));
    },
    async getUserPasswordHash(userId) {
        const { data } = await supabase_1.db
            .from("users")
            .select("password_hash")
            .eq("id", userId)
            .single();
        return data?.password_hash ?? null;
    },
    async findUserById(id) {
        const { data } = await supabase_1.db
            .from("users")
            .select("id, email, full_name, avatar_url, timezone, is_active")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        return data ?? null;
    },
    async findPrimaryWorkspace(userId) {
        const { data } = await supabase_1.db
            .from("workspace_members")
            .select("workspace_id, role")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .order("joined_at", { ascending: true })
            .limit(1)
            .single();
        if (!data)
            return null;
        return {
            workspaceId: data.workspace_id,
            role: data.role,
        };
    },
};
//# sourceMappingURL=auth.repository.js.map