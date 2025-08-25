import { createClient } from "@supabase/supabase-js";

// 1. Frontend Client (Safe for browser - uses anon key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Admin Client (Server-side only - uses service_role key)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);