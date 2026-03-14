import type {
  MediaFileVariantsWithMetadata,
  MediaFileWithMetadata,
} from "../_shared/types.ts";

export type RequestData = { images: unknown; preset?: unknown };

export type FfmpegArgs = {
  "-i": "pipe:0";
  "-vf": string;
  "-c:v": "libx264" | "libsvtav1" | "libvpx-vp9";
  "-crf": number;
  "-preset"?: number | "slow" | "medium" | "fast" | "superfast" | "ultrafast";
  "-b:v"?: number;
  "-movflags"?: "+frag_keyframe+empty_moov";
  "-an": boolean;
  "-f": "mp4" | "webm";
  "pipe:1": true;
};

export type VideoFormat = "mp4" | "webm";
export type VideoSize = 854 | 1280 | 1920;

export type VideoMetadata = {
  tags?: string[];
};

export type VideoFileWithMetadata = MediaFileWithMetadata<VideoMetadata>;
export type VideoFileVariantsWithMetadata = MediaFileVariantsWithMetadata<
  VideoMetadata
>;

export type RequestBody = {
  videos: VideoFileWithMetadata[];
  formats?: VideoFormat[];
  sizes?: VideoSize[];
};
