"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesController = void 0;
const messages_service_1 = require("./messages.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({
    workspaceId: req.workspaceId,
    userId: req.user.sub,
    role: req.user.role,
});
exports.messagesController = {
    async list(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await messages_service_1.messagesService.list(ctx(req), req.query));
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await messages_service_1.messagesService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async send(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await messages_service_1.messagesService.send(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async retry(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await messages_service_1.messagesService.retry(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=messages.controller.js.map