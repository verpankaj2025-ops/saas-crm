import { leadsRepository } from "./leads.repository";
import { NotFoundError, ValidationError } from "../../lib/errors";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Lead, CreateLeadDto, UpdateLeadDto, LeadFilter } from "./leads.types";

// Validate that any referenced FK belongs to the caller's workspace.
// FKs alone only prove the row exists, not that it's the same tenant.
async function assertReferencesInWorkspace(
  ctx: WorkspaceContext,
  refs: Pick<CreateLeadDto, "conversation_id" | "channel_id" | "assigned_agent">,
): Promise<void> {
  if (refs.conversation_id && !(await leadsRepository.conversationInWorkspace(ctx, refs.conversation_id))) {
    throw new ValidationError("Validation failed", { conversation_id: ["not found in workspace"] });
  }
  if (refs.channel_id && !(await leadsRepository.channelInWorkspace(ctx, refs.channel_id))) {
    throw new ValidationError("Validation failed", { channel_id: ["not found in workspace"] });
  }
  if (refs.assigned_agent && !(await leadsRepository.agentInWorkspace(ctx, refs.assigned_agent))) {
    throw new ValidationError("Validation failed", { assigned_agent: ["not a member of this workspace"] });
  }
}

export const leadsService = {
  async list(ctx: WorkspaceContext, filter: LeadFilter): Promise<ListResult<Lead>> {
    return leadsRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<Lead> {
    const lead = await leadsRepository.findById(ctx, id);
    if (!lead) throw new NotFoundError("Lead");
    return lead;
  },

  async create(ctx: WorkspaceContext, dto: CreateLeadDto): Promise<Lead> {
    if (!(await leadsRepository.contactInWorkspace(ctx, dto.contact_id))) {
      throw new ValidationError("Validation failed", { contact_id: ["not found in workspace"] });
    }
    await assertReferencesInWorkspace(ctx, dto);
    return leadsRepository.create(ctx, dto);
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateLeadDto): Promise<Lead> {
    await leadsService.get(ctx, id);          // 404 if missing / wrong workspace
    await assertReferencesInWorkspace(ctx, dto);
    return leadsRepository.update(ctx, id, dto);
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    await leadsService.get(ctx, id);
    await leadsRepository.softDelete(ctx, id);
  },
};
