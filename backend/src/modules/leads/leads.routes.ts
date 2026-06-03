import { Router } from "express";
import { leadsController } from "./leads.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateLeadSchema, UpdateLeadSchema, LeadFilterSchema } from "./leads.validation";

export const leadsRouter = Router();
leadsRouter.use(authMiddleware, tenantMiddleware);

leadsRouter.get(   "/",     validate(LeadFilterSchema, "query"), leadsController.list);
leadsRouter.get(   "/:id",                                      leadsController.get);
leadsRouter.post(  "/",     validate(CreateLeadSchema),         leadsController.create);
leadsRouter.patch( "/:id",  validate(UpdateLeadSchema),         leadsController.update);
leadsRouter.delete("/:id",                                      leadsController.delete);
