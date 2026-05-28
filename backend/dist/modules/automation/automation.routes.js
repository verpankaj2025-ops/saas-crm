"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationRouter = void 0;
const express_1 = require("express");
const automation_controller_1 = require("./automation.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const automation_validation_1 = require("./automation.validation");
exports.automationRouter = (0, express_1.Router)();
exports.automationRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
exports.automationRouter.get("/", (0, validate_middleware_1.validate)(automation_validation_1.AutomationFilterSchema, "query"), automation_controller_1.automationController.list);
exports.automationRouter.get("/:id", automation_controller_1.automationController.get);
exports.automationRouter.post("/", (0, validate_middleware_1.validate)(automation_validation_1.CreateAutomationSchema), automation_controller_1.automationController.create);
exports.automationRouter.patch("/:id", (0, validate_middleware_1.validate)(automation_validation_1.UpdateAutomationSchema), automation_controller_1.automationController.update);
exports.automationRouter.patch("/:id/toggle", automation_controller_1.automationController.toggle);
exports.automationRouter.delete("/:id", automation_controller_1.automationController.delete);
// Execution history — read-only, served from automation_executions table
exports.automationRouter.get("/:id/executions", automation_controller_1.automationController.get); // TODO: dedicated executions handler
//# sourceMappingURL=automation.routes.js.map