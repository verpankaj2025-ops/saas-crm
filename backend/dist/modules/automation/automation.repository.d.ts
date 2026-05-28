import type { UUID, ListResult, WorkspaceContext } from "../../types/common";
import type { AutomationRule, CreateAutomationDto, UpdateAutomationDto, AutomationFilter } from "./automation.types";
export declare const automationRepository: {
    findAll(ctx: WorkspaceContext, filter: AutomationFilter): Promise<ListResult<AutomationRule>>;
    findById(ctx: WorkspaceContext, id: UUID): Promise<AutomationRule | null>;
    create(ctx: WorkspaceContext, dto: CreateAutomationDto): Promise<AutomationRule>;
    update(ctx: WorkspaceContext, id: UUID, dto: UpdateAutomationDto): Promise<AutomationRule>;
    softDelete(ctx: WorkspaceContext, id: UUID): Promise<void>;
};
//# sourceMappingURL=automation.repository.d.ts.map