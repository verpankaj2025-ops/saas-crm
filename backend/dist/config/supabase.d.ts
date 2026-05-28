/**
 * Admin client — uses service role key.
 * Bypasses Row Level Security. Use ONLY in server-side code.
 * Never expose to the frontend.
 */
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
/**
 * Typed DB helper — wraps supabaseAdmin.from() for convenience.
 * Usage: db.from("contacts").select("*").eq("workspace_id", id)
 */
export declare const db: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
//# sourceMappingURL=supabase.d.ts.map