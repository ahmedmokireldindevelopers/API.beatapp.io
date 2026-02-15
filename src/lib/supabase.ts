import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL");
}

if (!supabaseServerKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY. SUPABASE_PUBLISHABLE_KEY alone is not enough for server upserts."
  );
}

// Service role key is server-side only. Do not expose it to client bundles.
export const supabase = createClient(supabaseUrl, supabaseServerKey, {
  auth: { persistSession: false }
});
