import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';

let supabase: SupabaseClient<Database> | undefined;

export default function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_KEY) as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  }

  if (!supabase) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabase;
}
