import type { UUID, PaginationQuery } from "../../types/common";
export interface AppointmentContact {
    id: UUID;
    first_name: string;
    last_name: string | null;
    phone: string | null;
}
export interface Appointment {
    id: UUID;
    workspace_id: UUID;
    contact_id: UUID;
    conversation_id: UUID | null;
    assigned_to: UUID | null;
    created_by: UUID | null;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    timezone: string;
    location: string | null;
    meeting_url: string | null;
    status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
    reminder_sent_at: string | null;
    external_cal_id: string | null;
    external_cal_type: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    contact?: AppointmentContact | null;
    reminders?: AppointmentReminder[];
}
export interface CreateAppointmentDto {
    contact_id: UUID;
    conversation_id?: UUID;
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
    timezone?: string;
    location?: string;
    meeting_url?: string;
    assigned_to?: UUID;
}
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
export interface UpdateAppointmentDto {
    title?: string;
    description?: string;
    start_at?: string;
    end_at?: string;
    timezone?: string;
    location?: string;
    meeting_url?: string;
    assigned_to?: UUID;
    status?: AppointmentStatus;
    reminder_sent_at?: string;
    external_cal_id?: string;
    external_cal_type?: string;
    metadata?: Record<string, unknown>;
}
export interface AppointmentFilter extends PaginationQuery {
    contact_id?: UUID;
    conversation_id?: UUID;
    assigned_to?: UUID;
    status?: AppointmentStatus;
    start_before?: string;
    start_after?: string;
    upcoming?: boolean;
}
export type ReminderStatus = "scheduled" | "sent" | "completed" | "cancelled" | "failed";
export interface AppointmentReminder {
    id: UUID;
    workspace_id: UUID;
    appointment_id: UUID;
    contact_id: UUID;
    reminder_type: "24h" | "2h";
    status: ReminderStatus;
    scheduled_for: string;
    sent_at: string | null;
    completed_at: string | null;
    failed_reason: string | null;
    retry_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface CreateReminderDto {
    appointment_id: UUID;
    reminder_type: "24h" | "2h";
    scheduled_for: string;
}
export interface UpdateReminderDto {
    status?: ReminderStatus;
    sent_at?: string;
    completed_at?: string;
    failed_reason?: string;
    retry_count?: number;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=appointments.types.d.ts.map