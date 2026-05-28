"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentsController = void 0;
const appointments_service_1 = require("./appointments.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({
    workspaceId: req.workspaceId,
    userId: req.user.sub,
    role: req.user.role,
});
exports.appointmentsController = {
    async list(req, res, next) {
        try {
            const r = await appointments_service_1.appointmentsService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await appointments_service_1.appointmentsService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await appointments_service_1.appointmentsService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await appointments_service_1.appointmentsService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async cancel(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await appointments_service_1.appointmentsService.cancel(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async complete(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await appointments_service_1.appointmentsService.complete(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await appointments_service_1.appointmentsService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=appointments.controller.js.map