import { templatesRepository } from "./templates.repository";
import { NotFoundError } from "../../lib/errors";
import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Template, CreateTemplateDto, UpdateTemplateDto, TemplateFilter } from "./templates.types";

// ── Variable substitution helpers ────────────────────────────────

interface VariableContext {
  name?: string;
  date?: string;
  time?: string;
  [key: string]: string | undefined;
}

function substituteVariables(body: string, context: VariableContext): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] || match;
  });
}

export const templatesService = {
  async list(ctx: WorkspaceContext, filter: TemplateFilter): Promise<ListResult<Template>> {
    return templatesRepository.findAll(ctx, filter);
  },

  async get(ctx: WorkspaceContext, id: string): Promise<Template> {
    const tmpl = await templatesRepository.findById(ctx, id);
    if (!tmpl) throw new NotFoundError("Template");
    return tmpl;
  },

  async create(ctx: WorkspaceContext, dto: CreateTemplateDto): Promise<Template> {
    return templatesRepository.create(ctx, dto);
  },

  async update(ctx: WorkspaceContext, id: string, dto: UpdateTemplateDto): Promise<Template> {
    await templatesService.get(ctx, id);
    return templatesRepository.update(ctx, id, dto);
  },

  async delete(ctx: WorkspaceContext, id: string): Promise<void> {
    await templatesService.get(ctx, id);
    await templatesRepository.softDelete(ctx, id);
  },

  async markUsed(ctx: WorkspaceContext, id: string): Promise<void> {
    await templatesRepository.markUsed(ctx, id);
  },

  async applyTemplate(ctx: WorkspaceContext, id: string, context: VariableContext): Promise<string> {
    const tmpl = await templatesService.get(ctx, id);
    return substituteVariables(tmpl.body, context);
  },

  // ── Safe variable substitution with sanitization ────────────────

  async applyTemplateSafe(ctx: WorkspaceContext, id: string, context: VariableContext): Promise<string> {
    const tmpl = await templatesService.get(ctx, id);
    
    // Sanitize context values to prevent injection
    const sanitizedContext: VariableContext = {};
    for (const [key, value] of Object.entries(context)) {
      if (value) {
        // Remove any HTML/script tags
        sanitizedContext[key] = value
          .replace(/<[^>]*>/g, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+=/gi, "")
          .trim();
      }
    }
    
    return substituteVariables(tmpl.body, sanitizedContext);
  },

  async syncApproval(_ctx: WorkspaceContext, _id: string): Promise<{ status: string }> {
    // TODO: call WhatsApp Cloud API to check template approval status
    return { status: "pending_approval" };
  },
};
