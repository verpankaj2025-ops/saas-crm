import { Router } from "express";
import type { Request, Response } from "express";
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
// Execution history — not yet implemented; returns 501 until a dedicated handler is added
// DO NOT map this to automationController.get — that returns the rule, not executions
automationRouter.get("/:id/executions", (_req: Request, res: Response) => {
  res.status(501).json({ success: false, error: "Execution history not yet implemented", code: "NOT_IMPLEMENTED" });
});
