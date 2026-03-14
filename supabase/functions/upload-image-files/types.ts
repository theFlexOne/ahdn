import { IMAGE_ENCODE, IMAGE_PRESETS } from "./constants.ts";

import type { SharpInput } from "sharp";
import type { Prettify } from "@supabase/supabase-js";

export type ImagePreset = keyof typeof IMAGE_PRESETS;
export type SizeKey = keyof (typeof IMAGE_PRESETS)[ImagePreset]; // "small" | "standard" | "large" ~ according to ChatGPT.
export type FormatKey = keyof typeof IMAGE_ENCODE;

type ImageVariant = Prettify<{
  data: Uint8Array;
  filename: string;
}>;

type ImageVariantsBySize = Prettify<Partial<Record<SizeKey, ImageVariant>>>;

type ImageVariantsByFormat = Prettify<Record<FormatKey, ImageVariantsBySize>>;

export type ImageSet = Prettify<{
  filenameBase: string;
  variants: ImageVariantsByFormat;
  alt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}>;

export type ImageData = {
  name: string;
  data: SharpInput;
  preset: ImagePreset;
  tags: string[];
  alt: string;
  metadata: Record<string, unknown>;
};

export type RequestData = {
  images: ImageData[];
  upsert?: boolean;
};

export type UploadImageMetadata = Prettify<
  Record<string, unknown> & {
    width: number;
    height: number;
    tags: string[];
    alt: string;
  }
>;

export type ImageFileWithMetadata = {
  file: File;
  metadata: UploadImageMetadata;
};

export type ImageFileVariantsWithMetadata = {
  files: File[];
  metadata: UploadImageMetadata;
};
