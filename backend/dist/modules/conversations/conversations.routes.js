"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsRouter = void 0;
const express_1 = require("express");
const conversations_controller_1 = require("./conversations.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const conversations_validation_1 = require("./conversations.validation");
exports.conversationsRouter = (0, express_1.Router)();
exports.conversationsRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
exports.conversationsRouter.get("/", (0, validate_middleware_1.validate)(conversations_validation_1.ConversationFilterSchema, "query"), conversations_controller_1.conversationsController.list);
exports.conversationsRouter.post("/", (0, validate_middleware_1.validate)(conversations_validation_1.CreateConversationSchema), conversations_controller_1.conversationsController.create);
exports.conversationsRouter.get("/:id", conversations_controller_1.conversationsController.get);
exports.conversationsRouter.patch("/:id/read", conversations_controller_1.conversationsController.markRead);
exports.conversationsRouter.patch("/:id", (0, validate_middleware_1.validate)(conversations_validation_1.UpdateConversationSchema), conversations_controller_1.conversationsController.update);
exports.conversationsRouter.delete("/:id", conversations_controller_1.conversationsController.delete);
//# sourceMappingURL=conversations.routes.js.map