export const VIDEO_FORMATS = [
  { extension: "mp4", mimeType: "video/mp4" },
  { extension: "webm", mimeType: "video/webm" },
] as const;

export const DEFAULT_VIDEO_FORMATS = ["mp4", "webm"] as const;
export const VIDEO_TRANSCODE_FILTER =
  "scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos,fps=30" as const;

const BASE_MP4_ARGS = {
  "-i": "pipe:0",
  "-c:v": "libx264",
  "-crf": 23,
  "-preset": "slow",
  "-movflags": "+frag_keyframe+empty_moov",
  "-an": true,
  "-f": "mp4",
  "pipe:1": true,
} as const;

const BASE_WEBM_ARGS = {
  "-i": "pipe:0",
  "-c:v": "libvpx-vp9",
  "-crf": 35,
  "-b:v": 0,
  "-an": true,
  "-f": "webm",
  "pipe:1": true,
} as const;

export const BASE_FORMAT_ARGS = {
  mp4: BASE_MP4_ARGS,
  webm: BASE_WEBM_ARGS,
} as const;

export const VIDEO_UPLOAD_BUCKET = "public_media" as const;
