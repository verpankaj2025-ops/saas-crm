"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentsRouter = void 0;
const express_1 = require("express");
const appointments_controller_1 = require("./appointments.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const appointments_validation_1 = require("./appointments.validation");
exports.appointmentsRouter = (0, express_1.Router)();
exports.appointmentsRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
exports.appointmentsRouter.get("/", (0, validate_middleware_1.validate)(appointments_validation_1.AppointmentFilterSchema, "query"), appointments_controller_1.appointmentsController.list);
exports.appointmentsRouter.post("/", (0, validate_middleware_1.validate)(appointments_validation_1.CreateAppointmentSchema), appointments_controller_1.appointmentsController.create);
exports.appointmentsRouter.patch("/:id/cancel", appointments_controller_1.appointmentsController.cancel);
exports.appointmentsRouter.patch("/:id/complete", appointments_controller_1.appointmentsController.complete);
exports.appointmentsRouter.patch("/:id", (0, validate_middleware_1.validate)(appointments_validation_1.UpdateAppointmentSchema), appointments_controller_1.appointmentsController.update);
exports.appointmentsRouter.get("/:id", appointments_controller_1.appointmentsController.get);
exports.appointmentsRouter.delete("/:id", appointments_controller_1.appointmentsController.delete);
//# sourceMappingURL=appointments.routes.js.map