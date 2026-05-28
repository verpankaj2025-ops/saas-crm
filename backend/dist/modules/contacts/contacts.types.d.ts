import type { UUID, PaginationQuery } from "../../types/common";
export interface Contact {
    id: UUID;
    workspace_id: UUID;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
    status: "active" | "inactive" | "archived";
    source: string;
    assigned_to: UUID | null;
    custom_fields: Record<string, unknown>;
    ai_summary: string | null;
    last_contacted_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface Tag {
    id: UUID;
    workspace_id: UUID;
    name: string;
    color: string;
    created_at: string;
}
export interface ContactWithTags extends Contact {
    tags: Tag[];
}
export interface ContactNote {
    id: UUID;
    workspace_id: UUID;
    contact_id: UUID;
    author_id: UUID | null;
    content: string;
    is_pinned: boolean;
    source: string;
    created_at: string;
    updated_at: string;
}
export interface CreateContactDto {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    source?: string;
    assigned_to?: UUID;
    custom_fields?: Record<string, unknown>;
}
export interface UpdateContactDto extends Partial<CreateContactDto> {
    status?: "active" | "inactive" | "archived";
}
export interface CreateTagDto {
    name: string;
    color?: string;
}
export interface CreateNoteDto {
    content: string;
    is_pinned?: boolean;
}
export interface UpdateNoteDto {
    content?: string;
    is_pinned?: boolean;
}
export interface ContactFilter extends PaginationQuery {
    status?: "active" | "inactive" | "archived";
    assigned_to?: UUID;
    search?: string;
    tag_ids?: UUID[];
}
//# sourceMappingURL=contacts.types.d.ts.map