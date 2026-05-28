import { contactsRepository } from "./contacts.repository";
import { NotFoundError } from "../../lib/errors";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type {
  ContactWithTags, Tag, ContactNote,
  CreateContactDto, UpdateContactDto, ContactFilter,
  CreateTagDto, CreateNoteDto, UpdateNoteDto,
} from "./contacts.types";

export const contactsService = {

  // ── Contacts ────────────────────────────────────────────────

  async list(ctx: WorkspaceContext, filter: ContactFilter): Promise<ListResult<ContactWithTags>> {
    return contactsRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<ContactWithTags> {
    const contact = await contactsRepository.findById(ctx, id);
    if (!contact) throw new NotFoundError("Contact");
    return contact;
  },

  async create(ctx: WorkspaceContext, dto: CreateContactDto): Promise<ContactWithTags> {
    return contactsRepository.create(ctx, dto);
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateContactDto): Promise<ContactWithTags> {
    await contactsService.get(ctx, id);
    return contactsRepository.update(ctx, id, dto);
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    await contactsService.get(ctx, id);
    await contactsRepository.softDelete(ctx, id);
  },

  // ── Workspace tags ───────────────────────────────────────────

  async listTags(ctx: WorkspaceContext): Promise<Tag[]> {
    return contactsRepository.listTags(ctx);
  },

  async createTag(ctx: WorkspaceContext, dto: CreateTagDto): Promise<Tag> {
    return contactsRepository.createTag(ctx, dto);
  },

  async addTag(ctx: WorkspaceContext, contactId: string, tagId: string): Promise<void> {
    await contactsService.get(ctx, contactId);
    await contactsRepository.addContactTag(ctx, contactId, tagId);
  },

  async removeTag(ctx: WorkspaceContext, contactId: string, tagId: string): Promise<void> {
    await contactsService.get(ctx, contactId);
    await contactsRepository.removeContactTag(ctx, contactId, tagId);
  },

  // ── Notes ─────────────────────────────────────────────────────

  async listNotes(ctx: WorkspaceContext, contactId: string): Promise<ContactNote[]> {
    await contactsService.get(ctx, contactId);
    return contactsRepository.listNotes(ctx, contactId);
  },

  async createNote(ctx: WorkspaceContext, contactId: string, dto: CreateNoteDto): Promise<ContactNote> {
    await contactsService.get(ctx, contactId);
    return contactsRepository.createNote(ctx, contactId, dto);
  },

  async updateNote(ctx: WorkspaceContext, contactId: string, noteId: string, dto: UpdateNoteDto): Promise<ContactNote> {
    const note = await contactsRepository.findNoteById(ctx, noteId);
    if (!note || note.contact_id !== contactId) throw new NotFoundError("Note");
    return contactsRepository.updateNote(ctx, noteId, dto);
  },

  async deleteNote(ctx: WorkspaceContext, contactId: string, noteId: string): Promise<void> {
    const note = await contactsRepository.findNoteById(ctx, noteId);
    if (!note || note.contact_id !== contactId) throw new NotFoundError("Note");
    await contactsRepository.deleteNote(ctx, noteId);
  },
};
