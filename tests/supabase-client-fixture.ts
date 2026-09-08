import { createClient } from "npm:@supabase/supabase-js@2.110.0";
export const supabase = createClient("https://supabase.invalid", "fixture-public-key", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
