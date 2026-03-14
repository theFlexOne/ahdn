import sharp from "sharp";
import uploadImage from "./uploadImage.ts";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FormatKey,
  ImageFileWithMetadata,
  ImageSet,
  UploadImageMetadata,
} from "../types.ts";

const IMAGE_MIME_TYPES: Record<FormatKey, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpg: "image/jpeg",
};

async function getImageDimensions(
  imageData: Uint8Array,
): Promise<Pick<UploadImageMetadata, "width" | "height">> {
  const image = sharp(imageData, { failOnError: false });
  const metadata = await image.metadata();

  if (metadata.width && metadata.height) {
    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  const { info } = await image.toBuffer({ resolveWithObject: true });

  return {
    width: info.width,
    height: info.height,
  };
}

async function buildUploadableImages(
  imageSet: ImageSet,
): Promise<ImageFileWithMetadata[]> {
  const uploadableImages: ImageFileWithMetadata[] = [];

  for (
    const [format, variantsBySize] of Object.entries(
      imageSet.variants,
    ) as Array<
      [FormatKey, ImageSet["variants"][FormatKey]]
    >
  ) {
    for (const variant of Object.values(variantsBySize)) {
      if (!variant) continue;

      const { width, height } = await getImageDimensions(variant.data);
      const fileData = Uint8Array.from(variant.data);

      uploadableImages.push({
        file: new File(
          [fileData],
          `${imageSet.filenameBase}-${width}.${format}`,
          {
            type: IMAGE_MIME_TYPES[format],
          },
        ),
        metadata: {
          ...imageSet.metadata,
          width,
          height,
          tags: imageSet.tags,
          alt: imageSet.alt,
        },
      });
    }
  }

  return uploadableImages;
}

export default async function uploadImageSet(
  supabase: SupabaseClient,
  images: ImageSet[],
  options: {
    upsert?: boolean;
  } = {
    upsert: false,
  },
) {
  const { upsert = false } = options;
  const uploadableImageSets = await Promise.all(
    images.map((imageSet) => buildUploadableImages(imageSet)),
  );

  return Promise.all(
    uploadableImageSets.map((imageSet) =>
      Promise.all(
        imageSet.map(({ file, metadata }) =>
          uploadImage(supabase, file, metadata, upsert)
        ),
      )
    ),
  );
}
