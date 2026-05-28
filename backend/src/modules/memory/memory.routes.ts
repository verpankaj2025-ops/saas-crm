import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { memoryController } from "./memory.controller";
import { UpdatePreferencesSchema, RefreshLeadScoreSchema } from "./memory.validation";

const router = Router();

// All routes require auth and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// ── Contact Preferences ───────────────────────────────────────────

router.get("/contacts/:id/preferences", memoryController.getPreferences);
router.put("/contacts/:id/preferences", validate(UpdatePreferencesSchema), memoryController.updatePreferences);

// ── Lead Scoring ───────────────────────────────────────────────────

router.get("/contacts/:id/lead-score", memoryController.getLeadScore);
router.post("/contacts/:id/lead-score/refresh", validate(RefreshLeadScoreSchema), memoryController.refreshLeadScore);

// ── Conversation Summary ───────────────────────────────────────────

router.get("/conversations/:id/summary", memoryController.getConversationSummary);

// ── Interaction Summary ────────────────────────────────────────────

router.get("/contacts/:id/interaction-summary", memoryController.getInteractionSummary);

// ── Customer Insights (aggregate) ─────────────────────────────────

router.get("/contacts/:id/insights", memoryController.getCustomerInsights);

// ── AI Context Builder ───────────────────────────────────────────

router.get("/conversations/:id/ai-context", memoryController.getAiContext);

export default router;
