import rateLimit from "express-rate-limit";

/** General API rate limiter: 100 req / 15 min per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests", code: "TOO_MANY_REQUESTS" },
});

/** Strict limiter for auth endpoints: 10 req / 15 min per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many auth attempts", code: "TOO_MANY_REQUESTS" },
});

/** Webhook receiver — lenient, high volume expected */
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
