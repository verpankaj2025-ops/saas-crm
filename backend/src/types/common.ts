/** UUID string alias for documentation clarity */
export type UUID = string;

/** All DB rows share these timestamp columns */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/** Soft-deletable rows also have this */
export interface SoftDelete {
  deleted_at: string | null;
}

/** Standard paginated list query params */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

/** Result wrapper returned by repositories */
export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Workspace-scoped query context passed to every repository call */
export interface WorkspaceContext {
  workspaceId: UUID;
  userId: UUID;
  role: string;
}
