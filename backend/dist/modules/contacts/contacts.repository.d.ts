import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { ContactWithTags, Tag, ContactNote, CreateContactDto, UpdateContactDto, ContactFilter, CreateTagDto, CreateNoteDto, UpdateNoteDto } from "./contacts.types";
export declare const contactsRepository: {
    findAll(ctx: WorkspaceContext, filter: ContactFilter): Promise<ListResult<ContactWithTags>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<ContactWithTags | null>;
    create(ctx: WorkspaceContext, dto: CreateContactDto): Promise<ContactWithTags>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateContactDto): Promise<ContactWithTags>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
    listTags(ctx: WorkspaceContext): Promise<Tag[]>;
    findTagById(ctx: WorkspaceContext, tagId: UUID): Promise<Tag | null>;
    createTag(ctx: WorkspaceContext, dto: CreateTagDto): Promise<Tag>;
    addContactTag(ctx: WorkspaceContext, contactId: UUID, tagId: UUID): Promise<void>;
    removeContactTag(_ctx: WorkspaceContext, contactId: UUID, tagId: UUID): Promise<void>;
    listNotes(ctx: WorkspaceContext, contactId: UUID): Promise<ContactNote[]>;
    findNoteById(ctx: WorkspaceContext, noteId: UUID): Promise<ContactNote | null>;
    createNote(ctx: WorkspaceContext, contactId: UUID, dto: CreateNoteDto): Promise<ContactNote>;
    updateNote(ctx: WorkspaceContext, noteId: UUID, dto: UpdateNoteDto): Promise<ContactNote>;
    deleteNote(ctx: WorkspaceContext, noteId: UUID): Promise<void>;
    findOrCreateByPhone(workspaceId: UUID, phone: string, profileName: string): Promise<{
        id: UUID;
        first_name: string;
        last_name: string | null;
    }>;
};
//# sourceMappingURL=contacts.repository.d.ts.map