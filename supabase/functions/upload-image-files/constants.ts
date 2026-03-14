export const IMAGE_PRESETS = {
  thumbnail: { small: 240, medium: 400, large: 640 },
  content: { small: 600, medium: 900, large: 1440 },
  hero: { small: 768, medium: 1280, large: 1920, xLarge: 2560 },
} as const;

export const IMAGE_PRESET_KEYS = Object.keys(IMAGE_PRESETS) as Array<
  keyof typeof IMAGE_PRESETS
>;

export const IMAGE_ENCODE = {
  avif: { quality: 45, effort: 6 }, // effort: 0–9
  webp: { quality: 75 }, // 0–100
  jpg: { quality: 82, mozjpeg: true },
} as const satisfies Record<"avif" | "webp" | "jpg", object>;
