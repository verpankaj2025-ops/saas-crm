import Redis from "ioredis";
export declare const redis: Redis;
/**
 * Cache helper — get or set with TTL (seconds).
 */
export declare function getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T>;
export declare const CACHE_KEYS: {
    workspace: (id: string) => string;
    user: (id: string) => string;
    contactCount: (workspaceId: string) => string;
};
//# sourceMappingURL=redis.d.ts.map