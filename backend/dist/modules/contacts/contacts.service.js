"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactsService = void 0;
const contacts_repository_1 = require("./contacts.repository");
const errors_1 = require("../../lib/errors");
exports.contactsService = {
    // ── Contacts ────────────────────────────────────────────────
    async list(ctx, filter) {
        return contacts_repository_1.contactsRepository.findAll(ctx, filter);
    },
    async get(ctx, id) {
        const contact = await contacts_repository_1.contactsRepository.findById(ctx, id);
        if (!contact)
            throw new errors_1.NotFoundError("Contact");
        return contact;
    },
    async create(ctx, dto) {
        return contacts_repository_1.contactsRepository.create(ctx, dto);
    },
    async update(ctx, id, dto) {
        await exports.contactsService.get(ctx, id);
        return contacts_repository_1.contactsRepository.update(ctx, id, dto);
    },
    async delete(ctx, id) {
        await exports.contactsService.get(ctx, id);
        await contacts_repository_1.contactsRepository.softDelete(ctx, id);
    },
    // ── Workspace tags ───────────────────────────────────────────
    async listTags(ctx) {
        return contacts_repository_1.contactsRepository.listTags(ctx);
    },
    async createTag(ctx, dto) {
        return contacts_repository_1.contactsRepository.createTag(ctx, dto);
    },
    async addTag(ctx, contactId, tagId) {
        await exports.contactsService.get(ctx, contactId);
        await contacts_repository_1.contactsRepository.addContactTag(ctx, contactId, tagId);
    },
    async removeTag(ctx, contactId, tagId) {
        await exports.contactsService.get(ctx, contactId);
        await contacts_repository_1.contactsRepository.removeContactTag(ctx, contactId, tagId);
    },
    // ── Notes ─────────────────────────────────────────────────────
    async listNotes(ctx, contactId) {
        await exports.contactsService.get(ctx, contactId);
        return contacts_repository_1.contactsRepository.listNotes(ctx, contactId);
    },
    async createNote(ctx, contactId, dto) {
        await exports.contactsService.get(ctx, contactId);
        return contacts_repository_1.contactsRepository.createNote(ctx, contactId, dto);
    },
    async updateNote(ctx, contactId, noteId, dto) {
        const note = await contacts_repository_1.contactsRepository.findNoteById(ctx, noteId);
        if (!note || note.contact_id !== contactId)
            throw new errors_1.NotFoundError("Note");
        return contacts_repository_1.contactsRepository.updateNote(ctx, noteId, dto);
    },
    async deleteNote(ctx, contactId, noteId) {
        const note = await contacts_repository_1.contactsRepository.findNoteById(ctx, noteId);
        if (!note || note.contact_id !== contactId)
            throw new errors_1.NotFoundError("Note");
        await contacts_repository_1.contactsRepository.deleteNote(ctx, noteId);
    },
};
//# sourceMappingURL=contacts.service.js.map