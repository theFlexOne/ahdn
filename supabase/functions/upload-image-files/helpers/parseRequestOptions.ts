import { DEFAULT_IMAGE_PRESET, IMAGE_PRESET_KEYS } from "../constants.ts";

import type { ImagePreset, UploadRequestOptions } from "../types.ts";

function isImagePreset(value: string): value is ImagePreset {
  return IMAGE_PRESET_KEYS.includes(value as ImagePreset);
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

export default function parseRequestOptions(
  formData: FormData,
): UploadRequestOptions {
  const presetValue = formData.get("preset");

  if (presetValue !== null && typeof presetValue !== "string") {
    throw new Error('Field "preset" must be a string');
  }

  const normalizedPreset = presetValue?.trim() || DEFAULT_IMAGE_PRESET;

  if (!isImagePreset(normalizedPreset)) {
    throw new Error(
      `Field "preset" must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
    );
  }

  return {
    preset: normalizedPreset,
    upsert: parseUpsert(formData.get("upsert")),
  };
}
