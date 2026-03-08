import path from "node:path";
import validateMediaMimeType from "./validateMediaMimeType.ts";
import { MediaFileWithMetadata } from "../types.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadMediaOptions = {
  bucket: string;
  upsert: boolean;
};

export default async function uploadMediaToBucket<
  T extends Record<string, unknown>,
>(
  supabase: SupabaseClient,
  media: MediaFileWithMetadata<T>,
  { bucket, upsert }: UploadMediaOptions,
) {
  validateMediaMimeType(media.file);

  const { file, metadata } = media;
  const destPath = path.join(
    `${file.type.match(/^image|video/)}s`,
    path.basename(file.name, path.extname(file.name)).match(
      "^.*?(?=-.*\\..*$)",
    )![0],
    file.name,
  );

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(destPath, file, {
        upsert,
        metadata,
      });

    if (error) throw error;
  } catch (error) {
    const err = new Error(
      `Error uploading file ${file.name} to bucket ${bucket}: ${error}`,
    );
    console.error(err);
    throw err;
  }

  return;
}
