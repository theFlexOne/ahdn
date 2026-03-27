import path from 'node:path';

import type { ParsedImageData } from '../types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function parseFormData(formData: FormData): ParsedImageData[] {
  const imageDataByIndex = new Map<number, Partial<ParsedImageData>>();

  formData.forEach((value, key) => {
    const match = key.match(/^(\w+)\[(\d+)\]$/);

    if (!match) {
      return;
    }

    const [, keyName, indexValue] = match;
    const index = Number(indexValue);
    const imageData = imageDataByIndex.get(index) ?? {};
    imageDataByIndex.set(index, imageData);

    if (keyName === 'file') {
      if (!(value instanceof File)) {
        throw new Error(`Field "${key}" must be a file`);
      }

      imageData.file = value;
      return;
    }

    switch (keyName) {
      case 'tags':
        if (typeof value !== 'string') {
          throw new Error(`Field "${key}" must be a string`);
        }

        imageData.tags ??= [];
        imageData.tags.push(value.trim());
        return;
      case 'alt':
        if (typeof value !== 'string') {
          throw new Error(`Field "${key}" must be a string`);
        }

        imageData.alt = value.trim();
        return;
      case 'metadata':
        if (typeof value !== 'string') {
          throw new Error(`Field "${key}" must be a JSON string`);
        }

        try {
          const parsedMetadata = JSON.parse(value) as unknown;

          if (!isRecord(parsedMetadata)) {
            throw new Error('metadata must be a JSON object');
          }

          imageData.metadata = parsedMetadata;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Field "${key}" is invalid: ${message}`);
        }

        return;
      default:
        console.warn(`Unknown form-data key: ${keyName}`);
    }
  });

  return [...imageDataByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([index, imageData]) => {
      if (!(imageData.file instanceof File)) {
        throw new Error(`Missing image file for index ${index}`);
      }

      if (imageData.file.type && !imageData.file.type.startsWith('image/')) {
        throw new Error(`File "${imageData.file.name}" must be an image`);
      }

      return {
        file: imageData.file,
        tags: imageData.tags?.filter((tag) => tag.length > 0) ?? [],
        alt:
          imageData.alt?.trim() ||
          path.basename(imageData.file.name, path.extname(imageData.file.name)),
        metadata: imageData.metadata ?? {},
      };
    });
}
