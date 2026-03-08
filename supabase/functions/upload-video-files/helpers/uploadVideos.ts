import { SupabaseClient } from "@supabase/supabase-js";
import uploadMediaListToBucket from "../../_shared/helpers/uploadMediaListToBucket.ts";
import { VideoFileWithMetadata, VideoMetadata } from "../types.ts";

export default function uploadVideos(
  supabase: SupabaseClient,
  videos: VideoFileWithMetadata[],
) {
  return uploadMediaListToBucket<VideoMetadata>(supabase, videos);
}
