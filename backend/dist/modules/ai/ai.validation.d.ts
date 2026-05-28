import { z } from "zod";
export declare const CreateMemorySchema: z.ZodObject<{
    entity_type: z.ZodEnum<["contact", "conversation", "workspace"]>;
    entity_id: z.ZodString;
    memory_type: z.ZodEnum<["fact", "preference", "summary", "intent", "context"]>;
    content: z.ZodString;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    entity_type: "workspace" | "contact" | "conversation";
    entity_id: string;
    memory_type: "fact" | "preference" | "summary" | "intent" | "context";
    attributes?: Record<string, unknown> | undefined;
    expires_at?: string | undefined;
}, {
    content: string;
    entity_type: "workspace" | "contact" | "conversation";
    entity_id: string;
    memory_type: "fact" | "preference" | "summary" | "intent" | "context";
    attributes?: Record<string, unknown> | undefined;
    expires_at?: string | undefined;
}>;
export declare const MemoryQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    memory_type: z.ZodOptional<z.ZodEnum<["fact", "preference", "summary", "intent", "context"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    memory_type?: "fact" | "preference" | "summary" | "intent" | "context" | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    memory_type?: "fact" | "preference" | "summary" | "intent" | "context" | undefined;
}>;
//# sourceMappingURL=ai.validation.d.ts.map