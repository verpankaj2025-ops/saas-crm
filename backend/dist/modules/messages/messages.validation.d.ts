import { z } from "zod";
export declare const SendMessageSchema: z.ZodObject<{
    conversation_id: z.ZodString;
    content_type: z.ZodDefault<z.ZodEnum<["text", "image", "document", "audio", "video", "template", "interactive"]>>;
    content: z.ZodOptional<z.ZodString>;
    is_internal: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content_type: "text" | "image" | "document" | "audio" | "video" | "template" | "interactive";
    conversation_id: string;
    content?: string | undefined;
    is_internal?: boolean | undefined;
}, {
    conversation_id: string;
    content?: string | undefined;
    content_type?: "text" | "image" | "document" | "audio" | "video" | "template" | "interactive" | undefined;
    is_internal?: boolean | undefined;
}>;
export declare const MessageFilterSchema: z.ZodObject<{
    conversation_id: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    before_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    conversation_id: string;
    before_id?: string | undefined;
}, {
    conversation_id: string;
    limit?: number | undefined;
    before_id?: string | undefined;
}>;
//# sourceMappingURL=messages.validation.d.ts.map