"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationController = void 0;
const automation_service_1 = require("./automation.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });
exports.automationController = {
    async list(req, res, next) {
        try {
            const r = await automation_service_1.automationService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await automation_service_1.automationService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await automation_service_1.automationService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await automation_service_1.automationService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async toggle(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await automation_service_1.automationService.toggle(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await automation_service_1.automationService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=automation.controller.js.map