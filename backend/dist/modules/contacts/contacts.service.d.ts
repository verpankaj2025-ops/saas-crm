import type { WorkspaceContext, ListResult } from "../../types/common";
import type { ContactWithTags, Tag, ContactNote, CreateContactDto, UpdateContactDto, ContactFilter, CreateTagDto, CreateNoteDto, UpdateNoteDto } from "./contacts.types";
export declare const contactsService: {
    list(ctx: WorkspaceContext, filter: ContactFilter): Promise<ListResult<ContactWithTags>>;
    get(ctx: WorkspaceContext, id: string): Promise<ContactWithTags>;
    create(ctx: WorkspaceContext, dto: CreateContactDto): Promise<ContactWithTags>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateContactDto): Promise<ContactWithTags>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
    listTags(ctx: WorkspaceContext): Promise<Tag[]>;
    createTag(ctx: WorkspaceContext, dto: CreateTagDto): Promise<Tag>;
    addTag(ctx: WorkspaceContext, contactId: string, tagId: string): Promise<void>;
    removeTag(ctx: WorkspaceContext, contactId: string, tagId: string): Promise<void>;
    listNotes(ctx: WorkspaceContext, contactId: string): Promise<ContactNote[]>;
    createNote(ctx: WorkspaceContext, contactId: string, dto: CreateNoteDto): Promise<ContactNote>;
    updateNote(ctx: WorkspaceContext, contactId: string, noteId: string, dto: UpdateNoteDto): Promise<ContactNote>;
    deleteNote(ctx: WorkspaceContext, contactId: string, noteId: string): Promise<void>;
};
//# sourceMappingURL=contacts.service.d.ts.map