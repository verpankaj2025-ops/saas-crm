import type { WorkspaceContext, ListResult } from "../../types/common";
import type { AutomationRule, CreateAutomationDto, UpdateAutomationDto, AutomationFilter } from "./automation.types";
export declare const automationService: {
    list(ctx: WorkspaceContext, filter: AutomationFilter): Promise<ListResult<AutomationRule>>;
    get(ctx: WorkspaceContext, id: string): Promise<AutomationRule>;
    create(ctx: WorkspaceContext, dto: CreateAutomationDto): Promise<AutomationRule>;
    update(ctx: WorkspaceContext, id: string, dto: UpdateAutomationDto): Promise<AutomationRule>;
    toggle(ctx: WorkspaceContext, id: string): Promise<AutomationRule>;
    delete(ctx: WorkspaceContext, id: string): Promise<void>;
};
//# sourceMappingURL=automation.service.d.ts.map