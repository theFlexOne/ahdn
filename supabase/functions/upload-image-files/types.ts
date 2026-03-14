import {
  IMAGE_FILE_FIELD_NAME,
  IMAGE_FORMATS,
  IMAGE_PRESETS,
} from "./constants.ts";

export type ParsedImageData = {
  file: File;
  tags?: string[];
  alt: string;
  metadata: Record<string, unknown>;
};

export type ImagePreset = keyof typeof IMAGE_PRESETS;
export type ImageFileFieldName = typeof IMAGE_FILE_FIELD_NAME;
export type ImageVariantExtension = typeof IMAGE_FORMATS[number]["extension"];
export type ImageVariantMimeType = typeof IMAGE_FORMATS[number]["mimeType"];

export type ImageVariantMetadata = Record<string, unknown> & {
  tags: string[];
  alt: string;
  width: number;
  height: number;
};

export type ImageVariantData = {
  mimeType: ImageVariantMimeType;
  width: number;
  height: number;
  file: File;
  metadata: ImageVariantMetadata;
};

export type ImageVariantsData = {
  filenameBase: string;
  variants: ImageVariantData[];
};

export type UploadImagesOptions = {
  bucket?: string;
  upsert?: boolean;
};

export type UploadRequestOptions = {
  preset: ImagePreset;
  upsert: boolean;
};

export type UploadedImageVariant = {
  id: string | null;
  path: string;
  fullPath: string | null;
  mimeType: ImageVariantMimeType;
  width: number;
  height: number;
};

export type UploadedImageVariantsData = {
  filenameBase: string;
  variants: UploadedImageVariant[];
};
