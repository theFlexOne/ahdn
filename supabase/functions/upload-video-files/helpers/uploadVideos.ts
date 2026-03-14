import { SupabaseClient } from "@supabase/supabase-js";
import uploadMediaListToBucket from "../../_shared/helpers/uploadMediaListToBucket.ts";
import { VideoFileVariantsWithMetadata, VideoMetadata } from "../types.ts";

export default function uploadVideoVariantsToBucket(
  supabase: SupabaseClient,
  videos: VideoFileVariantsWithMetadata[],
  options: {
    bucket?: string;
    upsert?: boolean;
  } = {},
) {
  return uploadMediaListToBucket<VideoMetadata>(supabase, videos, options);
}
