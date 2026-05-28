import { z } from "zod";
export declare const UpdatePreferencesSchema: z.ZodObject<{
    communication: z.ZodOptional<z.ZodEnum<["email", "phone", "whatsapp", "any"]>>;
    timezone: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    preferred_hours: z.ZodOptional<z.ZodString>;
    do_not_contact: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    timezone?: string | undefined;
    language?: string | undefined;
    communication?: "email" | "phone" | "whatsapp" | "any" | undefined;
    preferred_hours?: string | undefined;
    do_not_contact?: boolean | undefined;
}, {
    timezone?: string | undefined;
    language?: string | undefined;
    communication?: "email" | "phone" | "whatsapp" | "any" | undefined;
    preferred_hours?: string | undefined;
    do_not_contact?: boolean | undefined;
}>;
export declare const RefreshLeadScoreSchema: z.ZodObject<{
    force: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    force?: boolean | undefined;
}, {
    force?: boolean | undefined;
}>;
export declare const GenerateSummarySchema: z.ZodObject<{
    conversation_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversation_id: string;
}, {
    conversation_id: string;
}>;
//# sourceMappingURL=memory.validation.d.ts.map