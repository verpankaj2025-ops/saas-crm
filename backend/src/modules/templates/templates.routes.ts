import { Router } from "express";
import { templatesController } from "./templates.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateTemplateSchema, UpdateTemplateSchema, TemplateFilterSchema } from "./templates.validation";

export const templatesRouter = Router();
templatesRouter.use(authMiddleware, tenantMiddleware);

templatesRouter.get(   "/",          validate(TemplateFilterSchema, "query"), templatesController.list);
templatesRouter.get(   "/:id",                                                templatesController.get);
templatesRouter.post(  "/",          validate(CreateTemplateSchema),          templatesController.create);
templatesRouter.patch( "/:id",       validate(UpdateTemplateSchema),          templatesController.update);
templatesRouter.delete("/:id",                                                templatesController.delete);
templatesRouter.post(  "/:id/mark-used",                                      templatesController.markUsed);
templatesRouter.post(  "/:id/sync",                                           templatesController.syncApproval);
