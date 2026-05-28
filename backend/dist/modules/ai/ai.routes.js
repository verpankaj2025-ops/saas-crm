"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const ai_validation_1 = require("./ai.validation");
exports.aiRouter = (0, express_1.Router)();
exports.aiRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
exports.aiRouter.post("/contacts/:id/summarize", ai_controller_1.aiController.summarizeContact);
exports.aiRouter.post("/conversations/:id/suggest", ai_controller_1.aiController.suggestReply);
exports.aiRouter.get("/conversations/:id/suggestion", ai_controller_1.aiController.getSuggestion);
exports.aiRouter.post("/conversations/:id/suggestion", ai_controller_1.aiController.generateSuggestionDirect);
exports.aiRouter.get("/memories/:entityType/:entityId", ai_controller_1.aiController.getMemories);
exports.aiRouter.post("/memories/:entityType/:entityId", (0, validate_middleware_1.validate)(ai_validation_1.CreateMemorySchema), ai_controller_1.aiController.addMemory);
exports.aiRouter.delete("/memories/:id", ai_controller_1.aiController.deleteMemory);
//# sourceMappingURL=ai.routes.js.map