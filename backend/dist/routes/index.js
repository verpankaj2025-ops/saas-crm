"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_routes_1 = require("../modules/auth/auth.routes");
const contacts_routes_1 = require("../modules/contacts/contacts.routes");
const conversations_routes_1 = require("../modules/conversations/conversations.routes");
const messages_routes_1 = require("../modules/messages/messages.routes");
const followups_routes_1 = require("../modules/followups/followups.routes");
const appointments_routes_1 = require("../modules/appointments/appointments.routes");
const templates_routes_1 = require("../modules/templates/templates.routes");
const automation_routes_1 = require("../modules/automation/automation.routes");
const ai_routes_1 = require("../modules/ai/ai.routes");
const whatsapp_routes_1 = require("../modules/whatsapp/whatsapp.routes");
const memory_routes_1 = __importDefault(require("../modules/memory/memory.routes"));
exports.apiRouter = (0, express_1.Router)();
// Public routes
exports.apiRouter.use("/auth", auth_routes_1.authRouter);
// Webhook receiver (has its own rate limit — see whatsapp.routes.ts)
exports.apiRouter.use("/webhooks/whatsapp", whatsapp_routes_1.whatsappRouter);
// Protected routes — authMiddleware applied inside each module router
exports.apiRouter.use("/contacts", contacts_routes_1.contactsRouter);
exports.apiRouter.use("/conversations", conversations_routes_1.conversationsRouter);
exports.apiRouter.use("/messages", messages_routes_1.messagesRouter);
exports.apiRouter.use("/followups", followups_routes_1.followupsRouter);
exports.apiRouter.use("/appointments", appointments_routes_1.appointmentsRouter);
exports.apiRouter.use("/templates", templates_routes_1.templatesRouter);
exports.apiRouter.use("/automation", automation_routes_1.automationRouter);
exports.apiRouter.use("/ai", ai_routes_1.aiRouter);
exports.apiRouter.use("/memory", memory_routes_1.default);
//# sourceMappingURL=index.js.map