import { IMAGE_FORMATS, IMAGE_PRESETS } from './constants.js';

export type ImagePreset = keyof typeof IMAGE_PRESETS;
export type ImageVariantMimeType = (typeof IMAGE_FORMATS)[number]['mimeType'];
export type MultipartBody = Record<string, unknown>;

export type UploadedFile = {
  name: string;
  type: string;
  bytes: Uint8Array;
};

export type ImageVariantData = {
  mimeType: ImageVariantMimeType;
  width: number;
  height: number;
  filename: string;
  contentBase64: string;
};

export type ImageVariantsData = {
  filenameBase: string;
  variants: ImageVariantData[];
};
