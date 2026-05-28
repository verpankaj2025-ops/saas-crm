import { automationRepository } from "./automation.repository";
import { NotFoundError } from "../../lib/errors";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type { AutomationRule, CreateAutomationDto, UpdateAutomationDto, AutomationFilter } from "./automation.types";

export const automationService = {
  async list(ctx: WorkspaceContext, filter: AutomationFilter): Promise<ListResult<AutomationRule>> {
    return automationRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<AutomationRule> {
    const rule = await automationRepository.findById(ctx, id);
    if (!rule) throw new NotFoundError("Automation rule");
    return rule;
  },

  async create(ctx: WorkspaceContext, dto: CreateAutomationDto): Promise<AutomationRule> {
    return automationRepository.create(ctx, dto);
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateAutomationDto): Promise<AutomationRule> {
    await automationService.get(ctx, id);
    return automationRepository.update(ctx, id, dto);
  },

  async toggle(ctx: WorkspaceContext, id: string): Promise<AutomationRule> {
    const rule = await automationService.get(ctx, id);
    return automationRepository.update(ctx, id, { is_active: !rule.is_active });
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    await automationService.get(ctx, id);
    await automationRepository.softDelete(ctx, id);
  },
};
