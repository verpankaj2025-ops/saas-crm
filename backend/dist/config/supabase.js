"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
/**
 * Admin client — uses service role key.
 * Bypasses Row Level Security. Use ONLY in server-side code.
 * Never expose to the frontend.
 */
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
/**
 * Typed DB helper — wraps supabaseAdmin.from() for convenience.
 * Usage: db.from("contacts").select("*").eq("workspace_id", id)
 */
exports.db = exports.supabaseAdmin;
//# sourceMappingURL=supabase.js.map