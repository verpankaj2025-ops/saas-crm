import { Router } from "express";
import { aiController } from "./ai.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateMemorySchema } from "./ai.validation";

export const aiRouter = Router();
aiRouter.use(authMiddleware, tenantMiddleware);

aiRouter.post(  "/contacts/:id/summarize",          aiController.summarizeContact);
aiRouter.post(  "/conversations/:id/suggest",       aiController.suggestReply);
aiRouter.get(   "/conversations/:id/suggestion",   aiController.getSuggestion);
aiRouter.post(  "/conversations/:id/suggestion",   aiController.generateSuggestionDirect);
aiRouter.get(   "/memories/:entityType/:entityId",  aiController.getMemories);
aiRouter.post(  "/memories/:entityType/:entityId",  validate(CreateMemorySchema), aiController.addMemory);
aiRouter.delete("/memories/:id",                    aiController.deleteMemory);
