import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { memoryController } from "./memory.controller";
import { UpdatePreferencesSchema, RefreshLeadScoreSchema } from "./memory.validation";

export const memoryRouter = Router();

// All routes require auth and tenant context
memoryRouter.use(authMiddleware);
memoryRouter.use(tenantMiddleware);

// ── Contact Preferences ───────────────────────────────────────────

memoryRouter.get("/contacts/:id/preferences", memoryController.getPreferences);
memoryRouter.put("/contacts/:id/preferences", validate(UpdatePreferencesSchema), memoryController.updatePreferences);

// ── Lead Scoring ───────────────────────────────────────────────────

memoryRouter.get("/contacts/:id/lead-score", memoryController.getLeadScore);
memoryRouter.post("/contacts/:id/lead-score/refresh", validate(RefreshLeadScoreSchema), memoryController.refreshLeadScore);

// ── Conversation Summary ───────────────────────────────────────────

memoryRouter.get("/conversations/:id/summary", memoryController.getConversationSummary);

// ── Interaction Summary ────────────────────────────────────────────

memoryRouter.get("/contacts/:id/interaction-summary", memoryController.getInteractionSummary);

// ── Customer Insights (aggregate) ─────────────────────────────────

memoryRouter.get("/contacts/:id/insights", memoryController.getCustomerInsights);

// ── AI Context Builder ───────────────────────────────────────────

memoryRouter.get("/conversations/:id/ai-context", memoryController.getAiContext);

