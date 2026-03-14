import type { SupabaseClient } from "@supabase/supabase-js";
import type { UploadImageMetadata } from "../types.ts";

export default async function uploadImage(
  supabase: SupabaseClient,
  image: File,
  metadata: UploadImageMetadata,
  upsert = false,
) {
  const { data, error } = await supabase.storage
    .from("public_media")
    .upload(`images/${image.name}`, image, {
      upsert,
      contentType: image.type,
      metadata,
    });

  if (error) {
    throw error;
  }

  return data;
}
