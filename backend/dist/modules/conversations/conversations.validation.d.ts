import { z } from "zod";
export declare const CreateConversationSchema: z.ZodObject<{
    contact_id: z.ZodString;
    channel_id: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contact_id: string;
    channel_id: string;
    assigned_to?: string | undefined;
    subject?: string | undefined;
}, {
    contact_id: string;
    channel_id: string;
    assigned_to?: string | undefined;
    subject?: string | undefined;
}>;
export declare const UpdateConversationSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "pending", "resolved", "archived"]>>;
    assigned_to: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "archived" | "open" | "pending" | "resolved" | undefined;
    assigned_to?: string | null | undefined;
    subject?: string | undefined;
}, {
    status?: "archived" | "open" | "pending" | "resolved" | undefined;
    assigned_to?: string | null | undefined;
    subject?: string | undefined;
}>;
export declare const ConversationFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    status: z.ZodOptional<z.ZodEnum<["open", "pending", "resolved", "archived"]>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    contact_id: z.ZodOptional<z.ZodString>;
    channel_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort_dir: "asc" | "desc";
    status?: "archived" | "open" | "pending" | "resolved" | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    channel_id?: string | undefined;
}, {
    status?: "archived" | "open" | "pending" | "resolved" | undefined;
    limit?: number | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    page?: number | undefined;
    sort_dir?: "asc" | "desc" | undefined;
    channel_id?: string | undefined;
}>;
//# sourceMappingURL=conversations.validation.d.ts.map