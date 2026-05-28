import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { Template, CreateTemplateDto, UpdateTemplateDto, TemplateFilter } from "./templates.types";
export declare const templatesRepository: {
    findAll(ctx: WorkspaceContext, filter: TemplateFilter): Promise<ListResult<Template>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<Template | null>;
    create(ctx: WorkspaceContext, dto: CreateTemplateDto): Promise<Template>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateTemplateDto): Promise<Template>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
    markUsed(ctx: WorkspaceContext, id: UUID): Promise<void>;
};
//# sourceMappingURL=templates.repository.d.ts.map