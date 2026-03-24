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
  primaryVideo: "bg_hero_vid.av1.webm",
  secondaryVideo: "bg_hero_vid.h264.mp4",
  poster: "images/bg_hero_vid_first_frame.avif",
} as const;

export const PAGE_BACKGROUNDS = {
  bio: {
    paths: ["heroes/bio"],
    types: ["avif", "webp", "jpg"],
    defaultType: "avif",
    alt: "",
  },
  schedule: {
    paths: ["heroes/schedule"],
    types: ["avif", "webp", "jpg"],
    defaultType: "avif",
    alt: "",
  },
  gallery: {
    paths: ["heroes/gallery"],
    types: ["avif", "webp", "jpg"],
    defaultType: "avif",
    alt: "",
  },
  contact: {
    paths: ["heroes/contact"],
    types: ["avif", "webp", "jpg"],
    defaultType: "avif",
    alt: "",
  },
} as const;
