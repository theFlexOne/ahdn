import { MEDIA_BUCKET } from "@/constants";
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = getSupabaseClient();

export function getMediaUrl(path: string) {
  try {
    const { data } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error(error);
    return null;
  }
}
