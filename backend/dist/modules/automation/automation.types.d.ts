import type { UUID, PaginationQuery } from "../../types/common";
export interface AutomationRule {
    id: UUID;
    workspace_id: UUID;
    created_by: UUID | null;
    name: string;
    description: string | null;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    is_active: boolean;
    priority: number;
    run_count: number;
    last_run_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
export interface AutomationCondition {
    field: string;
    op: "eq" | "neq" | "contains" | "gt" | "lt" | "in";
    value: unknown;
}
export interface AutomationAction {
    type: "send_template" | "assign_agent" | "add_tag" | "create_followup" | "send_webhook";
    [key: string]: unknown;
}
export interface CreateAutomationDto {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config?: Record<string, unknown>;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
    priority?: number;
}
export interface UpdateAutomationDto extends Partial<CreateAutomationDto> {
    is_active?: boolean;
}
export interface AutomationFilter extends PaginationQuery {
    is_active?: boolean;
    trigger_type?: string;
}
//# sourceMappingURL=automation.types.d.ts.map