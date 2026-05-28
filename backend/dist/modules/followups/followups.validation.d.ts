import { z } from "zod";
export declare const CreateFollowupSchema: z.ZodObject<{
    contact_id: z.ZodString;
    conversation_id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
    due_at: z.ZodString;
    assigned_to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contact_id: string;
    priority: "low" | "medium" | "high";
    title: string;
    due_at: string;
    assigned_to?: string | undefined;
    conversation_id?: string | undefined;
    notes?: string | undefined;
}, {
    contact_id: string;
    title: string;
    due_at: string;
    assigned_to?: string | undefined;
    conversation_id?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    notes?: string | undefined;
}>;
export declare const UpdateFollowupSchema: z.ZodObject<{
    assigned_to: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    conversation_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>>;
    title: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    due_at: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["pending", "completed", "cancelled", "snoozed"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "completed" | "cancelled" | "snoozed" | undefined;
    assigned_to?: string | undefined;
    conversation_id?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    due_at?: string | undefined;
}, {
    status?: "pending" | "completed" | "cancelled" | "snoozed" | undefined;
    assigned_to?: string | undefined;
    conversation_id?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    title?: string | undefined;
    notes?: string | undefined;
    due_at?: string | undefined;
}>;
export declare const SnoozeFollowupSchema: z.ZodObject<{
    snooze_until: z.ZodString;
}, "strip", z.ZodTypeAny, {
    snooze_until: string;
}, {
    snooze_until: string;
}>;
export declare const FollowupFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    contact_id: z.ZodOptional<z.ZodString>;
    conversation_id: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "completed", "cancelled", "snoozed"]>>;
    due_before: z.ZodOptional<z.ZodString>;
    due_after: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort_dir: "asc" | "desc";
    status?: "pending" | "completed" | "cancelled" | "snoozed" | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    conversation_id?: string | undefined;
    due_before?: string | undefined;
    due_after?: string | undefined;
}, {
    status?: "pending" | "completed" | "cancelled" | "snoozed" | undefined;
    limit?: number | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    page?: number | undefined;
    sort_dir?: "asc" | "desc" | undefined;
    conversation_id?: string | undefined;
    due_before?: string | undefined;
    due_after?: string | undefined;
}>;
//# sourceMappingURL=followups.validation.d.ts.map