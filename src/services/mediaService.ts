import { MEDIA_BUCKET } from "@/constants";
import supabase from "@/lib/supabaseClient";

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
