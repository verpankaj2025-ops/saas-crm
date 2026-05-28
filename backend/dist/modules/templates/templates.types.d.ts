import type { UUID, PaginationQuery } from "../../types/common";
export interface Template {
    id: UUID;
    workspace_id: UUID;
    name: string;
    type: "whatsapp" | "email" | "sms";
    category: "greeting" | "followup" | "appointment" | "payment" | "custom";
    language: string;
    subject: string | null;
    body: string;
    footer: string | null;
    buttons: TemplateButton[];
    variables: string[];
    status: "draft" | "pending_approval" | "approved" | "rejected";
    external_id: string | null;
    is_active: boolean;
    usage_count: number;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}
export interface TemplateButton {
    type: "url" | "phone" | "quick_reply";
    text: string;
    value?: string;
}
export interface CreateTemplateDto {
    name: string;
    type: Template["type"];
    category?: string;
    language?: string;
    subject?: string;
    body: string;
    footer?: string;
    buttons?: TemplateButton[];
    variables?: string[];
}
export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
}
export interface TemplateFilter extends PaginationQuery {
    type?: Template["type"];
    category?: Template["category"];
    status?: Template["status"];
    search?: string;
    recently_used?: boolean;
}
//# sourceMappingURL=templates.types.d.ts.map