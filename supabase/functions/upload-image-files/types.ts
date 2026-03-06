import { ENCODE, IMAGE_PRESETS } from "./constants.ts";

export type ImagePreset = keyof typeof IMAGE_PRESETS;
export type SizeKey = keyof (typeof IMAGE_PRESETS)[ImagePreset]; // "small" | "standard" | "large" ~ according to ChatGPT.

export type FormatKey = keyof typeof ENCODE;
export type ImageSet = Record<FormatKey, Partial<Record<SizeKey, Uint8Array>>>;
