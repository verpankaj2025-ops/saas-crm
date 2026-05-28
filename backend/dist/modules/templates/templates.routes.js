"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesRouter = void 0;
const express_1 = require("express");
const templates_controller_1 = require("./templates.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const tenant_middleware_1 = require("../../middleware/tenant.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const templates_validation_1 = require("./templates.validation");
exports.templatesRouter = (0, express_1.Router)();
exports.templatesRouter.use(auth_middleware_1.authMiddleware, tenant_middleware_1.tenantMiddleware);
exports.templatesRouter.get("/", (0, validate_middleware_1.validate)(templates_validation_1.TemplateFilterSchema, "query"), templates_controller_1.templatesController.list);
exports.templatesRouter.get("/:id", templates_controller_1.templatesController.get);
exports.templatesRouter.post("/", (0, validate_middleware_1.validate)(templates_validation_1.CreateTemplateSchema), templates_controller_1.templatesController.create);
exports.templatesRouter.patch("/:id", (0, validate_middleware_1.validate)(templates_validation_1.UpdateTemplateSchema), templates_controller_1.templatesController.update);
exports.templatesRouter.delete("/:id", templates_controller_1.templatesController.delete);
exports.templatesRouter.post("/:id/mark-used", templates_controller_1.templatesController.markUsed);
exports.templatesRouter.post("/:id/sync", templates_controller_1.templatesController.syncApproval);
//# sourceMappingURL=templates.routes.js.map