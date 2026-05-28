import { Router } from "express";
import { automationController } from "./automation.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateAutomationSchema, UpdateAutomationSchema, AutomationFilterSchema } from "./automation.validation";

export const automationRouter = Router();
automationRouter.use(authMiddleware, tenantMiddleware);

automationRouter.get(   "/",               validate(AutomationFilterSchema, "query"), automationController.list);
automationRouter.get(   "/:id",                                                        automationController.get);
automationRouter.post(  "/",               validate(CreateAutomationSchema),           automationController.create);
automationRouter.patch( "/:id",            validate(UpdateAutomationSchema),           automationController.update);
automationRouter.patch( "/:id/toggle",                                                 automationController.toggle);
automationRouter.delete("/:id",                                                        automationController.delete);
// Execution history — read-only, served from automation_executions table
automationRouter.get(   "/:id/executions",                                             automationController.get); // TODO: dedicated executions handler
