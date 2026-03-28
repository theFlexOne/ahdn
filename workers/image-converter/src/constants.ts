export const port = Number(Deno.env.get("PORT") ?? "8080");
export const workerSharedSecret = Deno.env.get("WORKER_SHARED_SECRET")?.trim() ?? "";
export const maxUploadBytes = Number(Deno.env.get("MAX_UPLOAD_BYTES") ?? `${20 * 1024 * 1024}`);

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
