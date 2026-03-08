import { FfmpegArgs, VideoFormat, VideoSize } from "./types.ts";

const BASE_MP4_ARGS: Omit<FfmpegArgs, "-vf"> = {
  "-i": "pipe:0",
  "-c:v": "libx264",
  "-crf": 23,
  "-preset": "slow",
  "-movflags": "+frag_keyframe+empty_moov",
  "-an": true,
  "-f": "mp4",
  "pipe:1": true,
} as const;

const BASE_WEBM_ARGS: Omit<FfmpegArgs, "-vf"> = {
  "-i": "pipe:0",
  "-c:v": "libvpx-vp9",
  "-crf": 35,
  "-b:v": 0,
  "-an": true,
  "-f": "webm",
  "pipe:1": true,
} as const;

export const BASE_FORMATS: VideoFormat[] = ["mp4", "webm"];

export const BASE_FORMAT_ARGS: Record<
  typeof BASE_FORMATS[number],
  Omit<FfmpegArgs, "-vf">
> = {
  mp4: BASE_MP4_ARGS,
  webm: BASE_WEBM_ARGS,
};

export const BASE_SIZES: VideoSize[] = [854, 1280, 1920];
