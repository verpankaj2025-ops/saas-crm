import { z } from "zod";
export declare const CreateAutomationSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    trigger_type: z.ZodString;
    trigger_config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    conditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        op: z.ZodEnum<["eq", "neq", "contains", "gt", "lt", "in"]>;
        value: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }, {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }>, "many">>;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    priority: number;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    conditions: {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }[];
    actions: z.objectOutputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">[];
    description?: string | undefined;
}, {
    name: string;
    trigger_type: string;
    actions: z.objectInputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">[];
    description?: string | undefined;
    priority?: number | undefined;
    trigger_config?: Record<string, unknown> | undefined;
    conditions?: {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }[] | undefined;
}>;
export declare const UpdateAutomationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    trigger_type: z.ZodOptional<z.ZodString>;
    trigger_config: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    conditions: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        op: z.ZodEnum<["eq", "neq", "contains", "gt", "lt", "in"]>;
        value: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }, {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }>, "many">>>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
} & {
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    priority?: number | undefined;
    trigger_type?: string | undefined;
    trigger_config?: Record<string, unknown> | undefined;
    conditions?: {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }[] | undefined;
    actions?: z.objectOutputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
}, {
    is_active?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    priority?: number | undefined;
    trigger_type?: string | undefined;
    trigger_config?: Record<string, unknown> | undefined;
    conditions?: {
        field: string;
        op: "eq" | "neq" | "gt" | "lt" | "in" | "contains";
        value?: unknown;
    }[] | undefined;
    actions?: z.objectInputType<{
        type: z.ZodEnum<["send_template", "assign_agent", "add_tag", "create_followup", "send_webhook"]>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
}>;
export declare const AutomationFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    trigger_type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    is_active?: boolean | undefined;
    trigger_type?: string | undefined;
}, {
    limit?: number | undefined;
    is_active?: boolean | undefined;
    page?: number | undefined;
    trigger_type?: string | undefined;
}>;
//# sourceMappingURL=automation.validation.d.ts.map