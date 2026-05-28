"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.followupsController = void 0;
const followups_service_1 = require("./followups.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({
    workspaceId: req.workspaceId,
    userId: req.user.sub,
    role: req.user.role,
});
exports.followupsController = {
    async list(req, res, next) {
        try {
            const r = await followups_service_1.followupsService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, r.data, { page: r.page, limit: r.limit, total: r.total, totalPages: Math.ceil(r.total / r.limit) });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await followups_service_1.followupsService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await followups_service_1.followupsService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await followups_service_1.followupsService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async complete(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await followups_service_1.followupsService.complete(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async snooze(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await followups_service_1.followupsService.snooze(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async cancel(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await followups_service_1.followupsService.cancel(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await followups_service_1.followupsService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=followups.controller.js.map