"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsController = void 0;
const contacts_service_1 = require("./contacts.service");
const response_1 = require("../../lib/response");
const ctx = (req) => ({
    workspaceId: req.workspaceId,
    userId: req.user.sub,
    role: req.user.role,
});
exports.contactsController = {
    // ── Contacts ────────────────────────────────────────────────
    async list(req, res, next) {
        try {
            const result = await contacts_service_1.contactsService.list(ctx(req), req.query);
            (0, response_1.sendPaginated)(res, result.data, {
                page: result.page, limit: result.limit,
                total: result.total, totalPages: Math.ceil(result.total / result.limit),
            });
        }
        catch (err) {
            next(err);
        }
    },
    async get(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await contacts_service_1.contactsService.get(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await contacts_service_1.contactsService.create(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await contacts_service_1.contactsService.update(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            await contacts_service_1.contactsService.delete(ctx(req), req.params.id);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    // ── Workspace tags ───────────────────────────────────────────
    async listTags(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await contacts_service_1.contactsService.listTags(ctx(req)));
        }
        catch (err) {
            next(err);
        }
    },
    async createTag(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await contacts_service_1.contactsService.createTag(ctx(req), req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async addTag(req, res, next) {
        try {
            const { tag_id } = req.body;
            await contacts_service_1.contactsService.addTag(ctx(req), req.params.id, tag_id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    },
    async removeTag(req, res, next) {
        try {
            await contacts_service_1.contactsService.removeTag(ctx(req), req.params.id, req.params.tagId);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
    // ── Notes ─────────────────────────────────────────────────────
    async listNotes(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await contacts_service_1.contactsService.listNotes(ctx(req), req.params.id));
        }
        catch (err) {
            next(err);
        }
    },
    async createNote(req, res, next) {
        try {
            (0, response_1.sendCreated)(res, await contacts_service_1.contactsService.createNote(ctx(req), req.params.id, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async updateNote(req, res, next) {
        try {
            (0, response_1.sendSuccess)(res, await contacts_service_1.contactsService.updateNote(ctx(req), req.params.id, req.params.noteId, req.body));
        }
        catch (err) {
            next(err);
        }
    },
    async deleteNote(req, res, next) {
        try {
            await contacts_service_1.contactsService.deleteNote(ctx(req), req.params.id, req.params.noteId);
            (0, response_1.sendNoContent)(res);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=contacts.controller.js.map