"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_KEYS = exports.redis = void 0;
exports.getOrSet = getOrSet;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../lib/logger");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
});
exports.redis.on("connect", () => logger_1.logger.info("Redis connected"));
exports.redis.on("error", (err) => logger_1.logger.error("Redis error", { err }));
/**
 * Cache helper — get or set with TTL (seconds).
 */
async function getOrSet(key, ttlSeconds, fetcher) {
    const cached = await exports.redis.get(key);
    if (cached)
        return JSON.parse(cached);
    const fresh = await fetcher();
    await exports.redis.setex(key, ttlSeconds, JSON.stringify(fresh));
    return fresh;
}
exports.CACHE_KEYS = {
    workspace: (id) => `workspace:${id}`,
    user: (id) => `user:${id}`,
    contactCount: (workspaceId) => `workspace:${workspaceId}:contact_count`,
};
//# sourceMappingURL=redis.js.map