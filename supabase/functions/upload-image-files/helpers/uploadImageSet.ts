import uploadMediaListToBucket from "../../_shared/helpers/uploadMediaListToBucket.ts";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ImageFileWithMetadata,
  ImageMetadata,
  ImageSet,
} from "../types.ts";

export default function uploadImageSet(
  supabase: SupabaseClient,
  images: ImageSet[],
  options: {
    bucket?: string;
    upsert?: boolean;
  } = {},
) {
  const imagesToUpload: ImageFileWithMetadata[] = [];

  for (const image of images) {
    const avifFile = new File(image.avif.small, image.name, {});
    imagesToUpload.push({
      file: image,
      metadata: {
        width: image.width,
        height: image.height,
        tags: image.tags,
      },
    });
  }
  return uploadMediaListToBucket<ImageMetadata>(supabase, images, options);
}
