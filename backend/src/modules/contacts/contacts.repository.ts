import { db } from "../../config/supabase";
import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type {
  Contact, ContactWithTags, Tag, ContactNote,
  CreateContactDto, UpdateContactDto, ContactFilter,
  CreateTagDto, CreateNoteDto, UpdateNoteDto,
} from "./contacts.types";

// ── Select strings ────────────────────────────────────────────

const CONTACT_COLS =
  "id,workspace_id,first_name,last_name,email,phone,company,job_title,avatar_url," +
  "status,source,assigned_to,custom_fields,ai_summary,last_contacted_at,created_at,updated_at";

const CONTACT_WITH_TAGS =
  `${CONTACT_COLS},contact_tags(tag_id,tags(id,name,color,workspace_id,created_at))`;

const TAG_COLS  = "id,workspace_id,name,color,created_at";
const NOTE_COLS = "id,workspace_id,contact_id,author_id,content,is_pinned,source,created_at,updated_at";

// ── Helper: flatten Supabase join result → ContactWithTags ────

type RawTagJoin = { tag_id: string; tags: Tag | null };
type RawContact = Record<string, unknown> & { contact_tags: RawTagJoin[] };

function flattenTags(raw: RawContact): ContactWithTags {
  const { contact_tags, ...rest } = raw;
  return {
    ...(rest as unknown as Contact),
    tags: (contact_tags ?? []).map((ct) => ct.tags).filter((t): t is Tag => t !== null),
  };
}

// ── Repository ────────────────────────────────────────────────

export const contactsRepository = {

  // ── Contacts ────────────────────────────────────────────────

  async findAll(ctx: WorkspaceContext, filter: ContactFilter): Promise<ListResult<ContactWithTags>> {
    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 25;
    const from  = (page - 1) * limit;

    // Pre-filter by tag_ids via junction table
    let allowedIds: string[] | null = null;
    if (filter.tag_ids?.length) {
      const { data: ct } = await db
        .from("contact_tags")
        .select("contact_id")
        .in("tag_id", filter.tag_ids);
      allowedIds = [...new Set((ct ?? []).map((r) => r.contact_id as string))];
      if (allowedIds.length === 0) return { data: [], total: 0, page, limit };
    }

    let query = db
      .from("contacts")
      .select(CONTACT_WITH_TAGS, { count: "exact" })
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .range(from, from + limit - 1)
      .order(filter.sort_by ?? "created_at", { ascending: filter.sort_dir === "asc" });

    if (filter.status)      query = query.eq("status", filter.status);
    if (filter.assigned_to) query = query.eq("assigned_to", filter.assigned_to);
    if (allowedIds)         query = query.in("id", allowedIds);

    if (filter.search) {
      const s = filter.search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,company.ilike.%${s}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data:  (data ?? []).map((r) => flattenTags(r as unknown as RawContact)),
      total: count ?? 0,
      page,
      limit,
    };
  },

  async findById(ctx: WorkspaceContext, id: UUID): Promise<ContactWithTags | null> {
    const { data } = await db
      .from("contacts")
      .select(CONTACT_WITH_TAGS)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    return flattenTags(data as unknown as RawContact);
  },

  async create(ctx: WorkspaceContext, dto: CreateContactDto): Promise<ContactWithTags> {
    const { data, error } = await db
      .from("contacts")
      .insert({ ...dto, workspace_id: ctx.workspaceId, created_by: ctx.userId })
      .select(CONTACT_WITH_TAGS)
      .single();
    if (error) throw error;
    return flattenTags(data as unknown as RawContact);
  },

  async update(ctx: WorkspaceContext, id: UUID, dto: UpdateContactDto): Promise<ContactWithTags> {
    const { data, error } = await db
      .from("contacts")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .select(CONTACT_WITH_TAGS)
      .single();
    if (error) throw error;
    return flattenTags(data as unknown as RawContact);
  },

  async softDelete(ctx: WorkspaceContext, id: UUID): Promise<void> {
    const { error } = await db
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
    if (error) throw error;
  },

  // ── Workspace tags ───────────────────────────────────────────

  async listTags(ctx: WorkspaceContext): Promise<Tag[]> {
    const { data, error } = await db
      .from("tags")
      .select(TAG_COLS)
      .eq("workspace_id", ctx.workspaceId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Tag[];
  },

  async findTagById(ctx: WorkspaceContext, tagId: UUID): Promise<Tag | null> {
    const { data } = await db
      .from("tags")
      .select(TAG_COLS)
      .eq("id", tagId)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();
    return (data as Tag | null) ?? null;
  },

  async createTag(ctx: WorkspaceContext, dto: CreateTagDto): Promise<Tag> {
    const name = dto.name.trim();
    // Return existing tag if name matches (case-insensitive)
    const { data: existing } = await db
      .from("tags")
      .select(TAG_COLS)
      .eq("workspace_id", ctx.workspaceId)
      .ilike("name", name)
      .maybeSingle();
    if (existing) return existing as Tag;

    const { data, error } = await db
      .from("tags")
      .insert({ workspace_id: ctx.workspaceId, name, color: dto.color ?? "#6366f1" })
      .select(TAG_COLS)
      .single();
    if (error) throw error;
    return data as Tag;
  },

  // ── Contact ↔ tag junction ────────────────────────────────────

  async addContactTag(ctx: WorkspaceContext, contactId: UUID, tagId: UUID): Promise<void> {
    const tag = await contactsRepository.findTagById(ctx, tagId);
    if (!tag) throw new Error("Tag not found in workspace");
    await db
      .from("contact_tags")
      .upsert({ contact_id: contactId, tag_id: tagId, tagged_by: ctx.userId }, { onConflict: "contact_id,tag_id" });
  },

  async removeContactTag(_ctx: WorkspaceContext, contactId: UUID, tagId: UUID): Promise<void> {
    await db
      .from("contact_tags")
      .delete()
      .eq("contact_id", contactId)
      .eq("tag_id", tagId);
  },

  // ── Notes ─────────────────────────────────────────────────────

  async listNotes(ctx: WorkspaceContext, contactId: UUID): Promise<ContactNote[]> {
    const { data, error } = await db
      .from("contact_notes")
      .select(NOTE_COLS)
      .eq("contact_id", contactId)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContactNote[];
  },

  async findNoteById(ctx: WorkspaceContext, noteId: UUID): Promise<ContactNote | null> {
    const { data } = await db
      .from("contact_notes")
      .select(NOTE_COLS)
      .eq("id", noteId)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    return (data as ContactNote | null) ?? null;
  },

  async createNote(ctx: WorkspaceContext, contactId: UUID, dto: CreateNoteDto): Promise<ContactNote> {
    const { data, error } = await db
      .from("contact_notes")
      .insert({
        workspace_id: ctx.workspaceId,
        contact_id:   contactId,
        author_id:    ctx.userId,
        content:      dto.content,
        is_pinned:    dto.is_pinned ?? false,
        source:       "manual",
      })
      .select(NOTE_COLS)
      .single();
    if (error) throw error;
    return data as ContactNote;
  },

  async updateNote(ctx: WorkspaceContext, noteId: UUID, dto: UpdateNoteDto): Promise<ContactNote> {
    const { data, error } = await db
      .from("contact_notes")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .select(NOTE_COLS)
      .single();
    if (error) throw error;
    return data as ContactNote;
  },

  async deleteNote(ctx: WorkspaceContext, noteId: UUID): Promise<void> {
    const { error } = await db
      .from("contact_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("workspace_id", ctx.workspaceId);
    if (error) throw error;
  },

  // ── Webhook helpers (no auth context) ───────────────────────

  async findOrCreateByPhone(
    workspaceId: UUID,
    phone: string,
    profileName: string,
  ): Promise<{ id: UUID; first_name: string; last_name: string | null }> {
    // Strip all non-digits — matches the DB trigger normalization rule.
    // "+91 98765 43210" → "919876543210"
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!normalizedPhone) throw new Error(`findOrCreateByPhone: no digits in phone "${phone}"`);

    // Exact-match lookup on the indexed normalized_phone column.
    // The unique partial index (idx_contacts_normalized_phone) makes
    // this O(log n) instead of the previous O(n) ILIKE table scan.
    const { data: existing } = await db
      .from("contacts")
      .select("id,first_name,last_name")
      .eq("workspace_id", workspaceId)
      .eq("normalized_phone", normalizedPhone)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) return existing as { id: UUID; first_name: string; last_name: string | null };

    // Optimistic insert — create new contact from WhatsApp profile.
    // normalized_phone is set automatically by trg_contacts_normalize_phone.
    const parts     = profileName.trim().split(/\s+/);
    const firstName = parts[0] ?? "Unknown";
    const lastName  = parts.slice(1).join(" ") || null;

    const { data, error } = await db
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        first_name:   firstName,
        last_name:    lastName,
        phone:        `+${normalizedPhone}`,
        source:       "whatsapp",
        status:       "lead",
      })
      .select("id,first_name,last_name")
      .single();

    if (!error) return data as { id: UUID; first_name: string; last_name: string | null };

    // Unique violation (error 23505): a concurrent process inserted the
    // same phone between our SELECT and our INSERT. Fetch the winner.
    if (error.code === "23505") {
      const { data: raced } = await db
        .from("contacts")
        .select("id,first_name,last_name")
        .eq("workspace_id", workspaceId)
        .eq("normalized_phone", normalizedPhone)
        .is("deleted_at", null)
        .maybeSingle();
      if (raced) return raced as { id: UUID; first_name: string; last_name: string | null };
    }

    throw error;
  },
};
