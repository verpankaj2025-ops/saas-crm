import { db } from "../../config/supabase";
import { redis } from "../../config/redis";
import type { UUID } from "../../types/common";
import type { User, RefreshTokenRecord } from "./auth.types";

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const refreshKey = (token: string) => `refresh_token:${token}`;

export const authRepository = {
  async findUserByEmail(email: string): Promise<User | null> {
    const { data } = await db
      .from("users")
      .select("id, email, full_name, avatar_url, timezone, is_active")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single();
    return data ?? null;
  },

  async createUser(payload: {
    email: string;
    full_name: string;
    password_hash: string;
  }): Promise<User> {
    const { data, error } = await db
      .from("users")
      .insert({ ...payload, email: payload.email.toLowerCase() })
      .select("id, email, full_name, avatar_url, timezone, is_active")
      .single();
    if (error) throw error;
    return data;
  },

  async createWorkspace(name: string, ownerId: UUID): Promise<{ id: UUID }> {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data, error } = await db
      .from("workspaces")
      .insert({ name, slug, owner_id: ownerId })
      .select("id")
      .single();
    if (error) throw error;
    return data;
  },

  async addWorkspaceMember(workspaceId: UUID, userId: UUID, role = "owner"): Promise<void> {
    await db.from("workspace_members").insert({ workspace_id: workspaceId, user_id: userId, role });
  },

  async saveRefreshToken(token: string, record: RefreshTokenRecord): Promise<void> {
    await redis.setex(refreshKey(token), REFRESH_TOKEN_TTL, JSON.stringify(record));
  },

  async getRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    const raw = await redis.get(refreshKey(token));
    return raw ? (JSON.parse(raw) as RefreshTokenRecord) : null;
  },

  async deleteRefreshToken(token: string): Promise<void> {
    await redis.del(refreshKey(token));
  },

  async getUserPasswordHash(userId: UUID): Promise<string | null> {
    const { data } = await db
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();
    return (data as { password_hash: string } | null)?.password_hash ?? null;
  },

  async findUserById(id: UUID): Promise<User | null> {
    const { data } = await db
      .from("users")
      .select("id, email, full_name, avatar_url, timezone, is_active")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    return data ?? null;
  },

  async findPrimaryWorkspace(userId: UUID): Promise<{ workspaceId: UUID; role: string } | null> {
    const { data } = await db
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      workspaceId: (data as { workspace_id: UUID; role: string }).workspace_id,
      role: (data as { workspace_id: UUID; role: string }).role,
    };
  },
};
