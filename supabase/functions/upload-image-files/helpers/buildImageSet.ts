import sharp from "sharp";

import type { ResizeOptions } from "sharp";
import { IMAGE_ENCODE, IMAGE_PRESETS } from "../constants.ts";
import type { FormatKey, ImageData, ImageSet, SizeKey } from "../types.ts";

const FORMATS: FormatKey[] = ["avif", "webp", "jpg"];

async function getSourceWidth(image: sharp.Sharp): Promise<number> {
  const metadata = await image.metadata();

  if (metadata.width) {
    return metadata.width;
  }

  return (await image.toBuffer({ resolveWithObject: true })).info.width;
}

function encodeImage(
  image: sharp.Sharp,
  format: FormatKey,
): Promise<Uint8Array> {
  switch (format) {
    case "avif":
      return image.avif(IMAGE_ENCODE.avif).toBuffer();
    case "webp":
      return image.webp(IMAGE_ENCODE.webp).toBuffer();
    case "jpg":
      return image.jpeg(IMAGE_ENCODE.jpg).toBuffer();
  }
}

export default async function buildImageSet(
  { name, data, preset, tags, alt, metadata }: ImageData,
): Promise<ImageSet> {
  const filenameBase = name.split(".")[0];
  const sourceImage = sharp(data, { failOnError: false }).rotate(); // honor EXIF orientation
  const sourceWidth = await getSourceWidth(sourceImage);
  const presetWidths = Object.entries(IMAGE_PRESETS[preset]) as Array<
    [SizeKey, number]
  >;
  const variants: ImageSet["variants"] = { avif: {}, webp: {}, jpg: {} };

  for (const [size, targetWidth] of presetWidths) {
    if (targetWidth > sourceWidth) continue;

    const resizeOptions: ResizeOptions = {
      width: targetWidth,
      withoutEnlargement: true,
    };
    const resizedImage = sourceImage.clone().resize(resizeOptions);
    const encodedVariants = await Promise.all([
      encodeImage(resizedImage.clone(), "avif"),
      encodeImage(resizedImage.clone(), "webp"),
      encodeImage(resizedImage.clone(), "jpg"),
    ]);

    FORMATS.forEach((format, index) => {
      variants[format][size] = {
        filename: `${filenameBase}-${size}.${format}`,
        data: encodedVariants[index],
      };
    });
  }

  return {
    filenameBase,
    variants,
    alt,
    tags,
    metadata,
  };
}
