import { getSupabaseStorageUrl } from "./lib/supabaseHelpers";

export const MEDIA_BUCKET = "public_media" as const;

export const VALID_MIME_TYPES = {
  image: [
    "image/avif",
    "image/webp",
    "image/jpeg",
  ],
  video: [
    "video/webm",
    "video/mp4",
  ],
} as const;

export const HOME_PAGE_BACKGROUND = {
  primaryVideo: buildSrc("bg_hero_vid.av1.webm"),
  secondaryVideo: buildSrc("bg_hero_vid.h264.mp4"),
  poster: "images/bg_hero_vid_first_frame.avif",
} as const;

export const PAGE_BACKGROUNDS = {
  bio: {
    paths: ["heroes/bio"],
    types: ["avif"],
    defaultType: "avif",
    alt: "Band portrait",
  },
  schedule: {
    paths: ["heroes/schedule"],
    types: ["avif"],
    defaultType: "avif",
    alt: "Concert lights",
  },
  gallery: {
    paths: ["heroes/gallery"],
    types: ["avif"],
    defaultType: "avif",
    alt: "Live performance",
  },
  contact: {
    paths: ["heroes/contact"],
    types: ["avif"],
    defaultType: "avif",
    alt: "Stage close-up",
  },
} as const;

function buildSrc(filePath: string) {
  return `${getSupabaseStorageUrl()}/${MEDIA_BUCKET}/${filePath}`;
}
