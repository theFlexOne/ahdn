import { SharpInput } from "sharp";
import {
  MediaFileVariantsWithMetadata,
  MediaFileWithMetadata,
} from "../_shared/types.ts";
import { IMAGE_ENCODE, IMAGE_PRESETS } from "./constants.ts";
import { Prettify } from "@supabase/supabase-js";

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

export type ImageMetadata = {
  width: number;
  height: number;
  tags: string[];
};

export type ImageFileWithMetadata = MediaFileWithMetadata<ImageMetadata>;
export type ImageFileVariantsWithMetadata = MediaFileVariantsWithMetadata<
  ImageMetadata
>;
