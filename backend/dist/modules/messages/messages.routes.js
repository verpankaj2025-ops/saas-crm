"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRouter = void 0;
const express_1 = require("express");
const messages_controller_1 = require("./messages.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const messages_validation_1 = require("./messages.validation");
exports.messagesRouter = (0, express_1.Router)();
exports.messagesRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
// GET  /messages?conversation_id=  - list messages in a conversation (cursor-based)
// POST /messages                   - send a new message
// GET  /messages/:id               - get a single message
exports.messagesRouter.get("/", (0, validate_middleware_1.validate)(messages_validation_1.MessageFilterSchema, "query"), messages_controller_1.messagesController.list);
exports.messagesRouter.post("/", (0, validate_middleware_1.validate)(messages_validation_1.SendMessageSchema), messages_controller_1.messagesController.send);
exports.messagesRouter.post("/:id/retry", messages_controller_1.messagesController.retry);
exports.messagesRouter.get("/:id", messages_controller_1.messagesController.get);
//# sourceMappingURL=messages.routes.js.map