import { z } from "zod";
export declare const CreateTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["whatsapp", "email", "sms"]>;
    category: z.ZodDefault<z.ZodEnum<["greeting", "followup", "appointment", "payment", "custom"]>>;
    language: z.ZodDefault<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    footer: z.ZodOptional<z.ZodString>;
    buttons: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["url", "phone", "quick_reply"]>;
        text: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }, {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }>, "many">>;
    variables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "email" | "whatsapp" | "sms";
    name: string;
    body: string;
    category: "custom" | "greeting" | "followup" | "appointment" | "payment";
    language: string;
    subject?: string | undefined;
    footer?: string | undefined;
    buttons?: {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }[] | undefined;
    variables?: string[] | undefined;
}, {
    type: "email" | "whatsapp" | "sms";
    name: string;
    body: string;
    subject?: string | undefined;
    category?: "custom" | "greeting" | "followup" | "appointment" | "payment" | undefined;
    language?: string | undefined;
    footer?: string | undefined;
    buttons?: {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }[] | undefined;
    variables?: string[] | undefined;
}>;
export declare const UpdateTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["whatsapp", "email", "sms"]>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["greeting", "followup", "appointment", "payment", "custom"]>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    subject: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    body: z.ZodOptional<z.ZodString>;
    footer: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    buttons: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["url", "phone", "quick_reply"]>;
        text: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }, {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }>, "many">>>;
    variables: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    type?: "email" | "whatsapp" | "sms" | undefined;
    name?: string | undefined;
    body?: string | undefined;
    subject?: string | undefined;
    category?: "custom" | "greeting" | "followup" | "appointment" | "payment" | undefined;
    language?: string | undefined;
    footer?: string | undefined;
    buttons?: {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }[] | undefined;
    variables?: string[] | undefined;
}, {
    type?: "email" | "whatsapp" | "sms" | undefined;
    name?: string | undefined;
    body?: string | undefined;
    subject?: string | undefined;
    category?: "custom" | "greeting" | "followup" | "appointment" | "payment" | undefined;
    language?: string | undefined;
    footer?: string | undefined;
    buttons?: {
        type: "phone" | "url" | "quick_reply";
        text: string;
        value?: string | undefined;
    }[] | undefined;
    variables?: string[] | undefined;
}>;
export declare const TemplateFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["whatsapp", "email", "sms"]>>;
    category: z.ZodOptional<z.ZodEnum<["greeting", "followup", "appointment", "payment", "custom"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "pending_approval", "approved", "rejected"]>>;
    search: z.ZodOptional<z.ZodString>;
    recently_used: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    type?: "email" | "whatsapp" | "sms" | undefined;
    status?: "draft" | "pending_approval" | "approved" | "rejected" | undefined;
    search?: string | undefined;
    category?: "custom" | "greeting" | "followup" | "appointment" | "payment" | undefined;
    recently_used?: boolean | undefined;
}, {
    type?: "email" | "whatsapp" | "sms" | undefined;
    status?: "draft" | "pending_approval" | "approved" | "rejected" | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    page?: number | undefined;
    category?: "custom" | "greeting" | "followup" | "appointment" | "payment" | undefined;
    recently_used?: boolean | undefined;
}>;
//# sourceMappingURL=templates.validation.d.ts.map