import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../lib/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err: Error) => logger.error("Redis error", { err }));

/**
 * Cache helper — get or set with TTL (seconds).
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

export const CACHE_KEYS = {
  workspace: (id: string) => `workspace:${id}`,
  user: (id: string) => `user:${id}`,
  contactCount: (workspaceId: string) => `workspace:${workspaceId}:contact_count`,
};
