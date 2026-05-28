import type { WorkspaceContext, ListResult } from "../../types/common";
import type { Template, CreateTemplateDto, UpdateTemplateDto, TemplateFilter } from "./templates.types";
interface VariableContext {
    name?: string;
    date?: string;
    time?: string;
    [key: string]: string | undefined;
}
export declare const templatesService: {
    list(ctx: WorkspaceContext, filter: TemplateFilter): Promise<ListResult<Template>>;
    get(ctx: WorkspaceContext, id: string): Promise<Template>;
    create(ctx: WorkspaceContext, dto: CreateTemplateDto): Promise<Template>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateTemplateDto): Promise<Template>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
    markUsed(ctx: WorkspaceContext, id: string): Promise<void>;
    applyTemplate(ctx: WorkspaceContext, id: string, context: VariableContext): Promise<string>;
    applyTemplateSafe(ctx: WorkspaceContext, id: string, context: VariableContext): Promise<string>;
    syncApproval(_ctx: WorkspaceContext, _id: string): Promise<{
        status: string;
    }>;
};
export {};
//# sourceMappingURL=templates.service.d.ts.map