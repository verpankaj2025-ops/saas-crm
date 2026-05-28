"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsService = void 0;
const conversations_repository_1 = require("./conversations.repository");
const errors_1 = require("../../lib/errors");
const sockets_1 = require("../../sockets");
exports.conversationsService = {
    async list(ctx, filter) {
        return conversations_repository_1.conversationsRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const conv = await conversations_repository_1.conversationsRepository.findById(ctx, id);
        if (!conv)
            throw new errors_1.NotFoundError("Conversation");
        return conv;
    },
    async create(ctx, dto) {
        const conv = await conversations_repository_1.conversationsRepository.create(ctx, dto);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "conversation:created", conv);
        return conv;
    },
    async update(ctx, id, dto) {
        await exports.conversationsService.get(ctx, id);
        const conv = await conversations_repository_1.conversationsRepository.update(ctx, id, dto);
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "conversation:updated", conv);
        return conv;
    },
    async markRead(ctx, id) {
        const conv = await conversations_repository_1.conversationsRepository.markRead(ctx, id);
        if (!conv)
            throw new errors_1.NotFoundError("Conversation");
        (0, sockets_1.emitToWorkspace)(ctx.workspaceId, "conversation:updated", conv);
        return conv;
    },
    async delete(ctx, id) {
        await exports.conversationsService.get(ctx, id);
        await conversations_repository_1.conversationsRepository.softDelete(ctx, id);
    },
};
//# sourceMappingURL=conversations.service.js.map