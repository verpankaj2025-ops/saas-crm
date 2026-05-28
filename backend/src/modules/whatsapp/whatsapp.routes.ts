import { Router } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { webhookLimiter } from "../../middleware/rate-limit.middleware";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { whatsappService } from "./whatsapp.service";
import type { WhatsAppWebhookBody } from "./whatsapp.types";

export const whatsappRouter = Router();

// Webhook routes are PUBLIC — WhatsApp Cloud API does not send auth headers.
// Security: verify_token for GET, X-Hub-Signature-256 HMAC for POST + rate limiting.

// ── HMAC signature verification ──────────────────────────────

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  try {
    const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── GET — webhook verification challenge ─────────────────────

whatsappRouter.get("/", webhookLimiter, (req: Request, res: Response) => {
  const mode      = req.query["hub.mode"]         as string | undefined;
  const token     = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"]    as string | undefined;

  if (mode === "subscribe" && token && token === env.WHATSAPP_VERIFY_TOKEN) {
    logger.info("WhatsApp webhook verified");
    res.status(200).send(challenge);
  } else {
    logger.warn("WhatsApp webhook verification failed", { mode, token });
    res.sendStatus(403);
  }
});

// ── POST — inbound events ─────────────────────────────────────

whatsappRouter.post("/", webhookLimiter, (req: Request, res: Response) => {
  // Always respond 200 immediately — Meta retries on anything else
  res.sendStatus(200);

  // Validate HMAC signature when APP_SECRET is configured
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = req.headers["x-hub-signature-256"] as string | undefined;
    if (!sig || !req.rawBody) {
      logger.warn("WhatsApp: missing signature or raw body — skipping");
      return;
    }
    if (!verifySignature(req.rawBody, sig, appSecret)) {
      logger.warn("WhatsApp: invalid signature — dropping event");
      return;
    }
  }

  // Validate basic payload shape
  const body = req.body as WhatsAppWebhookBody;
  if (body?.object !== "whatsapp_business_account") {
    logger.debug("WhatsApp: non-whatsapp object, ignoring", { object: body?.object });
    return;
  }

  // Process asynchronously — do not await so HTTP response is already sent
  whatsappService.processWebhook(body).catch((err: unknown) => {
    logger.error("WhatsApp: unhandled error in processWebhook", { err });
  });
});
