export const STORAGE_URL_BASE =
  "https://lzgryhrztslevnuajiqm.supabase.co/storage/v1/object/public" as const;
export const MEDIA_BUCKET = "public_media" as const;
export const MEDIA_TABLE = "media" as const;

export const IMAGE_MIME_TYPES = [
  "image/avif",
  "image/webp",
  "image/jpeg",
] as const;
export const VIDEO_MIME_TYPES = [
  "video/webm",
  "video/mp4",
] as const;
