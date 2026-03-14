export const IMAGE_PRESETS = {
  thumbnail: { sm: 240, md: 400, lg: 640 },
  content: { sm: 600, md: 900, lg: 1440 },
  hero: { sm: 768, md: 1280, lg: 1920 },
} as const;

export const DEFAULT_IMAGE_PRESET = "content" as const;

export const IMAGE_PRESET_KEYS = Object.keys(IMAGE_PRESETS) as Array<
  keyof typeof IMAGE_PRESETS
>;

export const IMAGE_FORMATS = [
  { extension: "avif", mimeType: "image/avif" },
  { extension: "webp", mimeType: "image/webp" },
  { extension: "jpg", mimeType: "image/jpeg" },
] as const;

export const IMAGE_ENCODERS = {
  avif: { quality: 45, effort: 6 },
  webp: { quality: 75 },
  jpg: { quality: 82, mozjpeg: true },
} as const;

export const IMAGE_UPLOAD_BUCKET = "public_media" as const;

export const MAGICK_WASM_WASM_SPEC =
  "npm:@imagemagick/magick-wasm@0.0.30/magick.wasm" as const;
