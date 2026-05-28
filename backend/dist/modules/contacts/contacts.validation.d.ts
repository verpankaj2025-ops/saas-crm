import { z } from "zod";
export declare const CreateContactSchema: z.ZodObject<{
    first_name: z.ZodString;
    last_name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    job_title: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    custom_fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    first_name: string;
    email?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    company?: string | undefined;
    job_title?: string | undefined;
    source?: string | undefined;
    assigned_to?: string | undefined;
    custom_fields?: Record<string, unknown> | undefined;
}, {
    first_name: string;
    email?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    company?: string | undefined;
    job_title?: string | undefined;
    source?: string | undefined;
    assigned_to?: string | undefined;
    custom_fields?: Record<string, unknown> | undefined;
}>;
export declare const UpdateContactSchema: z.ZodObject<{
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    company: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    job_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    custom_fields: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "archived" | undefined;
    email?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    company?: string | undefined;
    job_title?: string | undefined;
    source?: string | undefined;
    assigned_to?: string | undefined;
    custom_fields?: Record<string, unknown> | undefined;
}, {
    status?: "active" | "inactive" | "archived" | undefined;
    email?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
    company?: string | undefined;
    job_title?: string | undefined;
    source?: string | undefined;
    assigned_to?: string | undefined;
    custom_fields?: Record<string, unknown> | undefined;
}>;
export declare const ContactFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodOptional<z.ZodString>;
    sort_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived"]>>;
    assigned_to: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    tag_ids: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodString, "many">>, string[] | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort_dir: "asc" | "desc";
    status?: "active" | "inactive" | "archived" | undefined;
    assigned_to?: string | undefined;
    search?: string | undefined;
    tag_ids?: string[] | undefined;
    sort_by?: string | undefined;
}, {
    status?: "active" | "inactive" | "archived" | undefined;
    limit?: number | undefined;
    assigned_to?: string | undefined;
    search?: string | undefined;
    tag_ids?: unknown;
    page?: number | undefined;
    sort_by?: string | undefined;
    sort_dir?: "asc" | "desc" | undefined;
}>;
export declare const CreateTagSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color?: string | undefined;
}, {
    name: string;
    color?: string | undefined;
}>;
export declare const AddTagSchema: z.ZodObject<{
    tag_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tag_id: string;
}, {
    tag_id: string;
}>;
export declare const CreateNoteSchema: z.ZodObject<{
    content: z.ZodString;
    is_pinned: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    is_pinned?: boolean | undefined;
}, {
    content: string;
    is_pinned?: boolean | undefined;
}>;
export declare const UpdateNoteSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    is_pinned: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    is_pinned?: boolean | undefined;
}, {
    content?: string | undefined;
    is_pinned?: boolean | undefined;
}>;
//# sourceMappingURL=contacts.validation.d.ts.map