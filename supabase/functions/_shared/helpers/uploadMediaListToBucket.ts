import uploadMediaToBucket from "./uploadMediaToBucket.ts";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaFileVariantsWithMetadata } from "../types.ts";
import { UPLOAD_MEDIA_DEFAULT_OPTIONS } from "../constants.ts";

export default async function uploadMediaListToBucket<
  T extends Record<string, unknown>,
>(
  supabase: SupabaseClient,
  media: MediaFileVariantsWithMetadata<T>[],
  options: {
    bucket?: string;
    upsert?: boolean;
  } = {},
) {
  try {
    const res = await Promise.all(
      media.map(async ({ files, metadata }) => {
        const uploadedFiles = files.map((file) =>
          uploadMediaToBucket(supabase, { file, metadata }, {
            ...UPLOAD_MEDIA_DEFAULT_OPTIONS,
            ...options,
          })
        );
        return {
          files: await Promise.all(uploadedFiles),
          metadata,
        };
      }),
    );

    return res;
  } catch (error) {
    console.error("Error uploading media", error);
    return [];
  }
}
