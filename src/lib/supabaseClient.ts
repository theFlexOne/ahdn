import { createClient } from "@supabase/supabase-js";
import { type Database } from "@/lib/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_KEY
) as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY",
  );
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;
