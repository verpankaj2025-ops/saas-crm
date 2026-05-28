import { Router } from "express";
import { appointmentsController } from "./appointments.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  AppointmentFilterSchema,
} from "./appointments.validation";

export const appointmentsRouter = Router();
appointmentsRouter.use(authMiddleware, tenantMiddleware);

appointmentsRouter.get(   "/",               validate(AppointmentFilterSchema, "query"), appointmentsController.list);
appointmentsRouter.post(  "/",               validate(CreateAppointmentSchema),          appointmentsController.create);
appointmentsRouter.patch( "/:id/cancel",                                              appointmentsController.cancel);
appointmentsRouter.patch( "/:id/complete",                                            appointmentsController.complete);
appointmentsRouter.patch( "/:id",            validate(UpdateAppointmentSchema),          appointmentsController.update);
appointmentsRouter.get(   "/:id",                                                     appointmentsController.get);
appointmentsRouter.delete("/:id",                                                     appointmentsController.delete);
