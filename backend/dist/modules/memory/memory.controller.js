"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryController = void 0;
const memory_service_1 = require("./memory.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });
exports.memoryController = {
    async getPreferences(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await memory_service_1.memoryService.getPreferences(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async updatePreferences(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await memory_service_1.memoryService.updatePreferences(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async getLeadScore(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await memory_service_1.memoryService.getLeadScore(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async refreshLeadScore(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await memory_service_1.memoryService.refreshLeadScore(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async getConversationSummary(req, res, next) {
        try {
            const summary = await memory_service_1.memoryService.generateConversationSummary(ctx(req), req.params.id);
            (0, response_1.sendSuccess)(res, summary);
        }
        catch (err) {
            next(err);
        }
    },
    async getInteractionSummary(req, res, next) {
        try {
            const summary = await memory_service_1.memoryService.generateInteractionSummary(ctx(req), req.params.id);
            (0, response_1.sendSuccess)(res, summary);
        }
        catch (err) {
            next(err);
        }
    },
    async getCustomerInsights(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await memory_service_1.memoryService.getCustomerInsights(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async getAiContext(req, res, next) {
        try {
            const context = await memory_service_1.memoryService.buildAiContext(ctx(req), req.params.id);
            (0, response_1.sendSuccess)(res, { context });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=memory.controller.js.map