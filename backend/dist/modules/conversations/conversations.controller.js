"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsController = void 0;
const conversations_service_1 = require("./conversations.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({
    workspaceId: req.workspaceId,
    userId: req.user.sub,
    role: req.user.role,
});
exports.conversationsController = {
    async list(req, res, next) {
        try {
            const result = await conversations_service_1.conversationsService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, result.data, { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await conversations_service_1.conversationsService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await conversations_service_1.conversationsService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await conversations_service_1.conversationsService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async markRead(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await conversations_service_1.conversationsService.markRead(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await conversations_service_1.conversationsService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=conversations.controller.js.map