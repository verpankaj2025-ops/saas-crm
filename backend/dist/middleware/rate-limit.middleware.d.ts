/** General API rate limiter: 100 req / 15 min per IP */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Strict limiter for auth endpoints: 10 req / 15 min per IP */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Webhook receiver — lenient, high volume expected */
export declare const webhookLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rate-limit.middleware.d.ts.map