import type { UUID, PaginationQuery } from "../../types/common";

export interface FollowupContact {
  id:         UUID;
  first_name: string;
  last_name:  string | null;
  phone:      string | null;
}

export interface Followup {
  id:              UUID;
  workspace_id:    UUID;
  contact_id:      UUID;
  conversation_id: UUID | null;
  assigned_to:     UUID | null;
  created_by:      UUID | null;
  title:           string;
  notes:           string | null;
  status:          "pending" | "completed" | "cancelled" | "snoozed";
  priority:        "low" | "medium" | "high";
  due_at:          string;
  completed_at:    string | null;
  snoozed_until:   string | null;
  metadata:        Record<string, unknown>;
  created_at:      string;
  updated_at:      string;
  deleted_at:      string | null;
  // Joined fields (present when using SELECT with contact join)
  contact?:        FollowupContact | null;
}

export interface CreateFollowupDto {
  contact_id:      UUID;
  conversation_id?: UUID;
  title:           string;
  notes?:          string;
  priority?:       Followup["priority"];
  due_at:          string;
  assigned_to?:    UUID;
}

export interface UpdateFollowupDto extends Partial<Omit<CreateFollowupDto, "contact_id">> {
  status?:       Followup["status"];
  completed_at?: string;
  snoozed_until?: string;
  metadata?:     Record<string, unknown>;
}

export interface SnoozeFollowupDto {
  snooze_until: string; // ISO 8601 datetime
}

export interface FollowupFilter extends PaginationQuery {
  contact_id?:      UUID;
  conversation_id?: UUID;
  assigned_to?:     UUID;
  status?:          Followup["status"];
  due_before?:      string;
  due_after?:       string;
}
