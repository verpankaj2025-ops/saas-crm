import { Router } from "express";
import { followupsController } from "./followups.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateFollowupSchema,
  UpdateFollowupSchema,
  SnoozeFollowupSchema,
  FollowupFilterSchema,
} from "./followups.validation";

export const followupsRouter = Router();
followupsRouter.use(authMiddleware, tenantMiddleware);

followupsRouter.get(   "/",               validate(FollowupFilterSchema, "query"), followupsController.list);
followupsRouter.post(  "/",               validate(CreateFollowupSchema),          followupsController.create);
followupsRouter.patch( "/:id/complete",                                            followupsController.complete);
followupsRouter.patch( "/:id/snooze",     validate(SnoozeFollowupSchema),          followupsController.snooze);
followupsRouter.patch( "/:id/cancel",                                              followupsController.cancel);
followupsRouter.patch( "/:id",            validate(UpdateFollowupSchema),          followupsController.update);
followupsRouter.get(   "/:id",                                                     followupsController.get);
followupsRouter.delete("/:id",                                                     followupsController.delete);
