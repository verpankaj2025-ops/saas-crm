import type { UUID, PaginationQuery } from "../../types/common";

export type LeadStatus = "new" | "contacted" | "qualified" | "booked" | "paid" | "lost";
export type LeadSource =
  | "whatsapp" | "meta_ads" | "website" | "google_business" | "manual" | "referral" | "other";

export interface Lead {
  id: UUID;
  workspace_id: UUID;
  contact_id: UUID;
  conversation_id: UUID | null;
  channel_id: UUID | null;
  source: LeadSource;
  package: string | null;
  amount: number;
  paid_amount: number;
  balance_amount: number;   // generated column (amount - paid_amount)
  status: LeadStatus;
  assigned_agent: UUID | null;
  notes: string | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateLeadDto {
  contact_id: UUID;
  conversation_id?: UUID | null;
  channel_id?: UUID | null;
  source?: LeadSource;
  package?: string | null;
  amount?: number;
  paid_amount?: number;
  status?: LeadStatus;
  assigned_agent?: UUID | null;
  notes?: string | null;
}

// balance_amount is never set directly — it is derived in the DB.
export interface UpdateLeadDto extends Partial<Omit<CreateLeadDto, "contact_id">> {}

export interface LeadFilter extends PaginationQuery {
  status?: LeadStatus;
  source?: LeadSource;
  assigned_agent?: UUID;
  contact_id?: UUID;
  search?: string;        // matches package / notes
}
