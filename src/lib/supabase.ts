import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const supabaseUrl = env.SUPABASE_URL;
const supabaseServerKey = env.SUPABASE_SERVER_KEY;

// Service role key is server-side only. Do not expose it to client bundles.
export const supabase = createClient(supabaseUrl, supabaseServerKey, {
  auth: { persistSession: false }
});
