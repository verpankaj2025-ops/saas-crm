import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import ws from "ws";

/**
 * Admin client — uses service role key.
 * Bypasses Row Level Security. Use ONLY in server-side code.
 * Never expose to the frontend.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
    },
  }
);

/**
 * Typed DB helper — wraps supabaseAdmin.from() for convenience.
 * Usage: db.from("contacts").select("*").eq("workspace_id", id)
 */
export const db = supabaseAdmin;
