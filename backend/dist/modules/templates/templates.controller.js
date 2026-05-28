"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesController = void 0;
const templates_service_1 = require("./templates.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });
exports.templatesController = {
    async list(req, res, next) {
        try {
            const r = await templates_service_1.templatesService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await templates_service_1.templatesService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await templates_service_1.templatesService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await templates_service_1.templatesService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await templates_service_1.templatesService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    async markUsed(req, res, next) {
        try {
            await templates_service_1.templatesService.markUsed(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    async syncApproval(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await templates_service_1.templatesService.syncApproval(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=templates.controller.js.map