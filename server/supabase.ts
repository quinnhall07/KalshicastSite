import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const anon = process.env.SUPABASE_ANON_KEY!;
const service =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("SUPABASE_URL missing");
if (!anon) throw new Error("SUPABASE_ANON_KEY missing");
if (!service) throw new Error("SUPABASE_SECRET_KEY (service role) missing");

export const supabaseAdmin = createClient(url, service, {
  auth: { persistSession: false },
});

export const supabaseAnon = createClient(url, anon, {
  auth: { persistSession: false },
});
