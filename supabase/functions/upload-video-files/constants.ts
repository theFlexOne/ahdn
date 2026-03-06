import { FfmpegArgs } from "./types.ts";

const BASE_MP4_ARGS: Omit<FfmpegArgs, "-vf"> = {
  "-i": "pipe:0",
  "-c:v": "libx264",
  "-crf": 23,
  "-preset": "slow",
  "-movflags": "+frag_keyframe+empty_moov",
  "-an": true,
  "-f": "mp4",
  pipe: 1,
};

const BASE_WEBM_ARGS: Omit<FfmpegArgs, "-vf"> = {
  "-i": "pipe:0",
  "-c:v": "libsvtav1",
  "-crf": 35,
  "-preset": 6,
  "-an": true,
  "-f": "webm",
  pipe: 1,
};

export const BASE_FORMAT_ARGS: Record<
  FfmpegArgs["-f"],
  Omit<FfmpegArgs, "-vf">
> = {
  mp4: BASE_MP4_ARGS,
  webm: BASE_WEBM_ARGS,
};
