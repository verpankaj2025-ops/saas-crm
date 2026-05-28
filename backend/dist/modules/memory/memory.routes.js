"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const memory_controller_1 = require("./memory.controller");
const memory_validation_1 = require("./memory.validation");
const router = (0, express_1.Router)();
// All routes require auth and tenant context
router.use(auth_middleware_1.authMiddleware);
router.use(tenant_middleware_1.tenantMiddleware);
// ── Contact Preferences ───────────────────────────────────────────
router.get("/contacts/:id/preferences", memory_controller_1.memoryController.getPreferences);
router.put("/contacts/:id/preferences", (0, validate_middleware_1.validate)(memory_validation_1.UpdatePreferencesSchema), memory_controller_1.memoryController.updatePreferences);
// ── Lead Scoring ───────────────────────────────────────────────────
router.get("/contacts/:id/lead-score", memory_controller_1.memoryController.getLeadScore);
router.post("/contacts/:id/lead-score/refresh", (0, validate_middleware_1.validate)(memory_validation_1.RefreshLeadScoreSchema), memory_controller_1.memoryController.refreshLeadScore);
// ── Conversation Summary ───────────────────────────────────────────
router.get("/conversations/:id/summary", memory_controller_1.memoryController.getConversationSummary);
// ── Interaction Summary ────────────────────────────────────────────
router.get("/contacts/:id/interaction-summary", memory_controller_1.memoryController.getInteractionSummary);
// ── Customer Insights (aggregate) ─────────────────────────────────
router.get("/contacts/:id/insights", memory_controller_1.memoryController.getCustomerInsights);
// ── AI Context Builder ───────────────────────────────────────────
router.get("/conversations/:id/ai-context", memory_controller_1.memoryController.getAiContext);
exports.default = router;
//# sourceMappingURL=memory.routes.js.map