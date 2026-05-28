import { Router } from "express";
import { messagesController } from "./messages.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { SendMessageSchema, MessageFilterSchema } from "./messages.validation";

export const messagesRouter = Router();
messagesRouter.use(authMiddleware, tenantMiddleware);

// GET  /messages?conversation_id=  - list messages in a conversation (cursor-based)
// POST /messages                   - send a new message
// GET  /messages/:id               - get a single message

messagesRouter.get(  "/",         validate(MessageFilterSchema, "query"), messagesController.list);
messagesRouter.post( "/",         validate(SendMessageSchema),             messagesController.send);
messagesRouter.post( "/:id/retry",                                         messagesController.retry);
messagesRouter.get(  "/:id",                                               messagesController.get);
