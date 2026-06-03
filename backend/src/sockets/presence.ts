// ── Workspace presence tracker ────────────────────────────────
// workspaceId → Set<userId> of users with ≥1 live socket.
// A user counts as "online" from their first connected socket until
// their last one disconnects, so multiple tabs are handled correctly.
//
// Kept dependency-free (pure in-memory state) so the multi-tab
// online/offline transition logic is easy to unit test.

const workspaceOnline = new Map<string, Set<string>>();

export function getOnlineUsers(workspaceId: string): string[] {
  return [...(workspaceOnline.get(workspaceId) ?? [])];
}

export function isUserOnline(workspaceId: string, userId: string): boolean {
  return workspaceOnline.get(workspaceId)?.has(userId) ?? false;
}

// Returns true only on the offline → online transition (first tab).
export function markUserOnline(workspaceId: string, userId: string): boolean {
  let online = workspaceOnline.get(workspaceId);
  if (!online) { online = new Set(); workspaceOnline.set(workspaceId, online); }
  if (online.has(userId)) return false;
  online.add(userId);
  return true;
}

// Returns true only on the online → offline transition (last tab).
export function markUserOffline(workspaceId: string, userId: string): boolean {
  const online = workspaceOnline.get(workspaceId);
  if (!online || !online.has(userId)) return false;
  online.delete(userId);
  if (online.size === 0) workspaceOnline.delete(workspaceId);
  return true;
}
