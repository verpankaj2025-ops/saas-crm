import { z } from "zod";
export declare const CreateAppointmentSchema: z.ZodEffects<z.ZodObject<{
    contact_id: z.ZodString;
    conversation_id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    start_at: z.ZodString;
    end_at: z.ZodString;
    timezone: z.ZodDefault<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    meeting_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    assigned_to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    contact_id: string;
    title: string;
    start_at: string;
    end_at: string;
    assigned_to?: string | undefined;
    description?: string | undefined;
    conversation_id?: string | undefined;
    location?: string | undefined;
    meeting_url?: string | undefined;
}, {
    contact_id: string;
    title: string;
    start_at: string;
    end_at: string;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    conversation_id?: string | undefined;
    location?: string | undefined;
    meeting_url?: string | undefined;
}>, {
    timezone: string;
    contact_id: string;
    title: string;
    start_at: string;
    end_at: string;
    assigned_to?: string | undefined;
    description?: string | undefined;
    conversation_id?: string | undefined;
    location?: string | undefined;
    meeting_url?: string | undefined;
}, {
    contact_id: string;
    title: string;
    start_at: string;
    end_at: string;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    conversation_id?: string | undefined;
    location?: string | undefined;
    meeting_url?: string | undefined;
}>;
export declare const UpdateAppointmentSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    start_at: z.ZodOptional<z.ZodString>;
    end_at: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    meeting_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    assigned_to: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["scheduled", "confirmed", "cancelled", "completed", "no_show"]>>;
    reminder_sent_at: z.ZodOptional<z.ZodString>;
    external_cal_id: z.ZodOptional<z.ZodString>;
    external_cal_type: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    start_at?: string | undefined;
    end_at?: string | undefined;
    meeting_url?: string | undefined;
    reminder_sent_at?: string | undefined;
    external_cal_id?: string | undefined;
    external_cal_type?: string | undefined;
}, {
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    start_at?: string | undefined;
    end_at?: string | undefined;
    meeting_url?: string | undefined;
    reminder_sent_at?: string | undefined;
    external_cal_id?: string | undefined;
    external_cal_type?: string | undefined;
}>, {
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    start_at?: string | undefined;
    end_at?: string | undefined;
    meeting_url?: string | undefined;
    reminder_sent_at?: string | undefined;
    external_cal_id?: string | undefined;
    external_cal_type?: string | undefined;
}, {
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    timezone?: string | undefined;
    assigned_to?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    title?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    start_at?: string | undefined;
    end_at?: string | undefined;
    meeting_url?: string | undefined;
    reminder_sent_at?: string | undefined;
    external_cal_id?: string | undefined;
    external_cal_type?: string | undefined;
}>;
export declare const AppointmentFilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_dir: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    contact_id: z.ZodOptional<z.ZodString>;
    conversation_id: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["scheduled", "confirmed", "cancelled", "completed", "no_show"]>>;
    start_before: z.ZodOptional<z.ZodString>;
    start_after: z.ZodOptional<z.ZodString>;
    upcoming: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sort_dir: "asc" | "desc";
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    conversation_id?: string | undefined;
    start_before?: string | undefined;
    start_after?: string | undefined;
    upcoming?: boolean | undefined;
}, {
    status?: "completed" | "cancelled" | "scheduled" | "confirmed" | "no_show" | undefined;
    limit?: number | undefined;
    assigned_to?: string | undefined;
    contact_id?: string | undefined;
    page?: number | undefined;
    sort_dir?: "asc" | "desc" | undefined;
    conversation_id?: string | undefined;
    start_before?: string | undefined;
    start_after?: string | undefined;
    upcoming?: boolean | undefined;
}>;
export declare const CreateReminderSchema: z.ZodObject<{
    appointment_id: z.ZodString;
    reminder_type: z.ZodEnum<["24h", "2h"]>;
    scheduled_for: z.ZodString;
}, "strip", z.ZodTypeAny, {
    appointment_id: string;
    scheduled_for: string;
    reminder_type: "24h" | "2h";
}, {
    appointment_id: string;
    scheduled_for: string;
    reminder_type: "24h" | "2h";
}>;
export declare const UpdateReminderSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["scheduled", "sent", "completed", "cancelled", "failed"]>>;
    sent_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    failed_reason: z.ZodOptional<z.ZodString>;
    retry_count: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status?: "sent" | "failed" | "completed" | "cancelled" | "scheduled" | undefined;
    completed_at?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    retry_count?: number | undefined;
    sent_at?: string | undefined;
    failed_reason?: string | undefined;
}, {
    status?: "sent" | "failed" | "completed" | "cancelled" | "scheduled" | undefined;
    completed_at?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    retry_count?: number | undefined;
    sent_at?: string | undefined;
    failed_reason?: string | undefined;
}>;
//# sourceMappingURL=appointments.validation.d.ts.map