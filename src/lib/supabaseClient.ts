import { createClient } from "@supabase/supabase-js";
import { type Database } from "@/lib/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars. Check VITE_SUPABASE_URL / VITE_SUPABASE_KEY");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
