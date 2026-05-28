"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const env_1 = require("../../config/env");
const logger_1 = require("../../lib/logger");
const whatsapp_service_1 = require("./whatsapp.service");
exports.whatsappRouter = (0, express_1.Router)();
// Webhook routes are PUBLIC — WhatsApp Cloud API does not send auth headers.
// Security: verify_token for GET, X-Hub-Signature-256 HMAC for POST + rate limiting.
// ── HMAC signature verification ──────────────────────────────
function verifySignature(rawBody, signature, secret) {
    try {
        const expected = `sha256=${(0, crypto_1.createHmac)("sha256", secret).update(rawBody).digest("hex")}`;
        const a = Buffer.from(expected);
        const b = Buffer.from(signature);
        if (a.length !== b.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(a, b);
    }
    catch {
        return false;
    }
}
// ── GET — webhook verification challenge ─────────────────────
exports.whatsappRouter.get("/", rate_limit_middleware_1.webhookLimiter, (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token && token === env_1.env.WHATSAPP_VERIFY_TOKEN) {
        logger_1.logger.info("WhatsApp webhook verified");
        res.status(200).send(challenge);
    }
    else {
        logger_1.logger.warn("WhatsApp webhook verification failed", { mode, token });
        res.sendStatus(403);
    }
});
// ── POST — inbound events ─────────────────────────────────────
exports.whatsappRouter.post("/", rate_limit_middleware_1.webhookLimiter, (req, res) => {
    // Always respond 200 immediately — Meta retries on anything else
    res.sendStatus(200);
    // Validate HMAC signature when APP_SECRET is configured
    const appSecret = env_1.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
        const sig = req.headers["x-hub-signature-256"];
        if (!sig || !req.rawBody) {
            logger_1.logger.warn("WhatsApp: missing signature or raw body — skipping");
            return;
        }
        if (!verifySignature(req.rawBody, sig, appSecret)) {
            logger_1.logger.warn("WhatsApp: invalid signature — dropping event");
            return;
        }
    }
    // Validate basic payload shape
    const body = req.body;
    if (body?.object !== "whatsapp_business_account") {
        logger_1.logger.debug("WhatsApp: non-whatsapp object, ignoring", { object: body?.object });
        return;
    }
    // Process asynchronously — do not await so HTTP response is already sent
    whatsapp_service_1.whatsappService.processWebhook(body).catch((err) => {
        logger_1.logger.error("WhatsApp: unhandled error in processWebhook", { err });
    });
});
//# sourceMappingURL=whatsapp.routes.js.map