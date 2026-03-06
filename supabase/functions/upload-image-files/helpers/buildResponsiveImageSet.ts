import sharp from "sharp";

import type { Sharp, SharpInput } from "sharp";
import { ENCODE, IMAGE_PRESETS } from "../constants.ts";
import { ImagePreset, ImageSet, SizeKey } from "../types.ts";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type BuildResponsiveImageSetOptions = {};

export default async function buildResponsiveImageSet(
  input: SharpInput,
  imageClass: ImagePreset,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: BuildResponsiveImageSetOptions = {},
): Promise<ImageSet> {
  if (!input) {
    throw new Error("input is required");
  }

  const base = sharp(input).rotate(); // honor EXIF orientation

  const meta = await base.metadata();
  const sourceWidth = meta.width ||
    (await base.toBuffer({ resolveWithObject: true })).info.width;

  const presets = IMAGE_PRESETS[imageClass];

  const out: ImageSet = { avif: {}, webp: {}, jpg: {} };

  const entries = Object.entries(presets) as Array<[SizeKey, number]>;

  for (const [size, targetWidth] of entries) {
    if (targetWidth > sourceWidth) continue;

    const resizeOpts: Parameters<Sharp["resize"]>[0] = {
      width: targetWidth,
      withoutEnlargement: true,
    };

    await Promise.all([
      out.avif[size] = await base
        .clone()
        .resize(resizeOpts)
        .avif(ENCODE.avif)
        .toBuffer(),
      out.webp[size] = await base
        .clone()
        .resize(resizeOpts)
        .webp(ENCODE.webp)
        .toBuffer(),
      out.jpg[size] = await base
        .clone()
        .resize(resizeOpts)
        .jpeg(ENCODE.jpg)
        .toBuffer(),
    ]);
  }

  return out;
}
