import type { SupabaseClient } from "@supabase/supabase-js";
import { VIDEO_UPLOAD_BUCKET } from "../constants.ts";

import type {
  UploadedVideoVariantsData,
  UploadVideosOptions,
  VideoVariantsData,
} from "../types.ts";

export default async function uploadVideos(
  supabase: SupabaseClient,
  videos: VideoVariantsData[],
  options: UploadVideosOptions = {},
): Promise<UploadedVideoVariantsData[]> {
  const {
    bucket = VIDEO_UPLOAD_BUCKET,
    upsert = false,
  } = options;

  return await Promise.all(
    videos.map(async ({ filenameBase, variants }) => ({
      filenameBase,
      variants: await Promise.all(
        variants.map(async (variant) => {
          const uploadPath = `videos/${variant.file.name}`;
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(uploadPath, variant.file, {
              upsert,
              contentType: variant.file.type,
              metadata: variant.metadata,
            });

          if (error) {
            throw new Error(
              `Failed to upload "${variant.file.name}": ${error.message}`,
            );
          }

          return {
            id: data?.id ?? null,
            path: data?.path ?? uploadPath,
            fullPath: data?.fullPath ?? null,
            mimeType: variant.mimeType,
            width: variant.width,
            height: variant.height,
          };
        }),
      ),
    })),
  );
}
