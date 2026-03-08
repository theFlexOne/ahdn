import uploadMediaToBucket from "./uploadMediaToBucket.ts";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaFileWithMetadata } from "../types.ts";

const DEFAULT_OPTIONS = {
  bucket: "public_media",
  upsert: false,
};

export default async function uploadMediaListToBucket<
  T extends Record<string, unknown>,
>(
  supabase: SupabaseClient,
  media: MediaFileWithMetadata<T>[],
  options: {
    bucket?: string;
    upsert?: boolean;
  } = {},
) {
  const fails: Error[] = [];
  try {
    await Promise.all(
      media.map((m) =>
        uploadMediaToBucket(supabase, m, { ...DEFAULT_OPTIONS, ...options })
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      fails.push(error);
    }

    console.error(fails);
  }
}
