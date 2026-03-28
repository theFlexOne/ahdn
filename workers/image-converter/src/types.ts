import { IMAGE_FORMATS } from "./constants.ts";

export type ImageOutputFormat = (typeof IMAGE_FORMATS)[number];
export type ImageVariantMimeType = ImageOutputFormat["mimeType"];

export type ImageConversionOptions = {
  formats: ImageOutputFormat[];
  widths: number[];
};

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
