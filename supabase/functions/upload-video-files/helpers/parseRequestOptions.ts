import { DEFAULT_VIDEO_FORMATS } from "../constants.ts";

import type { UploadRequestOptions, VideoFormat } from "../types.ts";

function isVideoFormat(value: string): value is VideoFormat {
  return DEFAULT_VIDEO_FORMATS.includes(value as VideoFormat);
}

function parseUpsert(formDataValue: FormDataEntryValue | null): boolean {
  if (formDataValue === null) {
    return false;
  }

  if (typeof formDataValue !== "string") {
    throw new Error('Field "upsert" must be a string');
  }

  const normalizedValue = formDataValue.trim().toLowerCase();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === "true" || normalizedValue === "1") {
    return true;
  }

  if (normalizedValue === "false" || normalizedValue === "0") {
    return false;
  }

  throw new Error('Field "upsert" must be "true", "false", "1", or "0"');
}

function parseStringList(
  formData: FormData,
  keys: readonly string[],
): string[] {
  return keys.flatMap((key) => formData.getAll(key))
    .map((value) => {
      if (typeof value !== "string") {
        throw new Error(`Field "${keys[0]}" must be a string`);
      }

      return value.trim();
    })
    .filter(Boolean);
}

function parseFormats(formData: FormData): VideoFormat[] {
  const rawFormats = parseStringList(formData, ["formats", "format"]);

  if (rawFormats.length === 0) {
    return [...DEFAULT_VIDEO_FORMATS];
  }

  return [...new Set(rawFormats)].map((format) => {
    if (!isVideoFormat(format)) {
      throw new Error(
        `Field "formats" must be one of: ${DEFAULT_VIDEO_FORMATS.join(", ")}`,
      );
    }

    return format;
  });
}

export default function parseRequestOptions(
  formData: FormData,
): UploadRequestOptions {
  return {
    formats: parseFormats(formData),
    upsert: parseUpsert(formData.get("upsert")),
  };
}
