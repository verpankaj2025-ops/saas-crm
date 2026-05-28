"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const ai_service_1 = require("./ai.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({ workspaceId: req.workspaceId, userId: req.user.sub, role: req.user.role });
exports.aiController = {
    async getMemories(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await ai_service_1.aiService.getMemories(ctx(req), req.params.entityType, req.params.entityId));
        }
        catch (err) {
            next(err);
        }
    },
    async addMemory(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await ai_service_1.aiService.addMemory(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async deleteMemory(req, res, next) {
        try {
            await ai_service_1.aiService.deleteMemory(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    async summarizeContact(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await ai_service_1.aiService.requestContactSummary(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async suggestReply(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await ai_service_1.aiService.requestReplySuggestion(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async getSuggestion(req, res, next) {
        try {
            const request = {
                conversation_id: req.params.id,
                tone: req.query.tone || "professional",
                force_ai: req.query.force_ai === "true",
            };
            (0, response_1.sendSuccess)(res, await ai_service_1.aiService.getSuggestion(ctx(req), request));
        }
        catch (err) {
            next(err);
        }
    },
    async generateSuggestionDirect(req, res, next) {
        try {
            const tone = req.query.tone || "professional";
            const suggestion = await ai_service_1.aiService.generateSuggestionDirect(ctx(req), req.params.id, tone);
            (0, response_1.sendSuccess)(res, { suggestion });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=ai.controller.js.map