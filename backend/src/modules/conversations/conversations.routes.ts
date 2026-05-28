import { Router } from "express";
import { conversationsController } from "./conversations.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateConversationSchema, UpdateConversationSchema, ConversationFilterSchema } from "./conversations.validation";

export const conversationsRouter = Router();
conversationsRouter.use(authMiddleware, tenantMiddleware);

conversationsRouter.get(   "/",         validate(ConversationFilterSchema, "query"), conversationsController.list);
conversationsRouter.post(  "/",         validate(CreateConversationSchema),          conversationsController.create);
conversationsRouter.get(   "/:id",                                                   conversationsController.get);
conversationsRouter.patch( "/:id/read",                                              conversationsController.markRead);
conversationsRouter.patch( "/:id",      validate(UpdateConversationSchema),          conversationsController.update);
conversationsRouter.delete("/:id",                                                   conversationsController.delete);
