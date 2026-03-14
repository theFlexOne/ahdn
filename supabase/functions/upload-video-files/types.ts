import { DEFAULT_VIDEO_FORMATS, VIDEO_FORMATS } from "./constants.ts";

export type ParsedVideoData = {
  file: File;
  tags?: string[];
  metadata: Record<string, unknown>;
};

export type VideoFormat = typeof DEFAULT_VIDEO_FORMATS[number];
export type VideoVariantMimeType = typeof VIDEO_FORMATS[number]["mimeType"];

export type FfmpegArgs = {
  "-i": "pipe:0";
  "-vf": string;
  "-c:v": "libx264" | "libvpx-vp9";
  "-crf": number;
  "-preset"?: "slow" | "medium" | "fast" | "superfast" | "ultrafast";
  "-b:v"?: number;
  "-movflags"?: "+frag_keyframe+empty_moov";
  "-an": true;
  "-f": VideoFormat;
  "pipe:1": true;
};

export type VideoVariantMetadata = Record<string, unknown> & {
  tags: string[];
  width: number;
  height: number;
};

export type VideoVariantData = {
  mimeType: VideoVariantMimeType;
  width: number;
  height: number;
  file: File;
  metadata: VideoVariantMetadata;
};

export type VideoVariantsData = {
  filenameBase: string;
  variants: VideoVariantData[];
};

export type UploadVideosOptions = {
  bucket?: string;
  upsert?: boolean;
};

export type UploadRequestOptions = {
  formats: VideoFormat[];
  upsert: boolean;
};

export type UploadedVideoVariant = {
  id: string | null;
  path: string;
  fullPath: string | null;
  mimeType: VideoVariantMimeType;
  width: number;
  height: number;
};

export type UploadedVideoVariantsData = {
  filenameBase: string;
  variants: UploadedVideoVariant[];
};
