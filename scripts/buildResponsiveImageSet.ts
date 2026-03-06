import sharp from "sharp";

import type { Sharp, SharpInput } from "sharp";

const IMAGE_PRESETS = {
  thumbnail: { small: 240, standard: 400, large: 640 },
  content: { small: 600, standard: 900, large: 1440 },
  hero: { small: 768, standard: 1280, large: 1920 },
} as const;

const ENCODE = {
  avif: { quality: 45, effort: 6 }, // effort: 0–9
  webp: { quality: 75 }, // 0–100
  jpg: { quality: 82, mozjpeg: true },
} as const satisfies Record<FormatKey, object>;

type ImagePreset = keyof typeof IMAGE_PRESETS;
type SizeKey = keyof (typeof IMAGE_PRESETS)[ImagePreset]; // "small" | "standard" | "large"

type FormatKey = "avif" | "webp" | "jpg";
type ImageSet = Record<FormatKey, Partial<Record<SizeKey, Buffer>>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type BuildResponsiveImageSetOptions = {};
export type BuildResponsiveImageSetsForPresetOptions = {
  async?: boolean;
};

export async function buildResponsiveImageSet(
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

export async function buildResponsiveImageSetsForPreset(
  inputs: Parameters<typeof buildResponsiveImageSet>[0][],
  preset: ImagePreset,
  options: BuildResponsiveImageSetsForPresetOptions,
): Promise<ImageSet[]> {
  const {
    async = false,
  } = options;

  const sets: ImageSet[] = [];

  if (async) {
    await Promise.all(
      inputs.map(async (input) => {
        sets.push(await buildResponsiveImageSet(input, preset));
      }),
    );
  } else {
    for (const input of inputs) {
      sets.push(await buildResponsiveImageSet(input, preset));
    }
  }

  return sets;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main() {}
