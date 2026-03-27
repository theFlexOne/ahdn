import path from 'node:path';
import { DEFAULT_IMAGE_PRESET } from '../constants.ts';

import type {
  ImagePreset,
  ImageVariantData,
  ImageVariantMimeType,
  ImageVariantsData,
  ParsedImageData,
} from '../types.ts';

const DEFAULT_LOCAL_IMAGE_CONVERTER_URL = 'http://127.0.0.1:8080/convert' as const;

type WorkerImageVariantData = {
  mimeType: ImageVariantMimeType;
  width: number;
  height: number;
  filename: string;
  contentBase64: string;
};

type WorkerImageVariantsData = {
  filenameBase: string;
  variants: WorkerImageVariantData[];
};

type WorkerResponseBody = {
  results: WorkerImageVariantsData[];
};

function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || path.extname(file.name).toLowerCase() === '.svg';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readEnv(key: string): string | undefined {
  try {
    const value = Deno.env.get(key)?.trim();
    return value || undefined;
  } catch (error) {
    if (error instanceof Deno.errors.NotCapable) {
      return undefined;
    }

    throw error;
  }
}

function normalizeWorkerUrl(urlValue: string): string {
  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    throw new Error(`IMAGE_CONVERTER_URL is invalid: ${urlValue}`);
  }

  if (url.pathname === '' || url.pathname === '/') {
    url.pathname = '/convert';
  }

  return url.toString();
}

function getWorkerUrl(): string {
  const configuredWorkerUrl = readEnv('IMAGE_CONVERTER_URL');

  if (configuredWorkerUrl) {
    return normalizeWorkerUrl(configuredWorkerUrl);
  }

  const supabaseUrl = readEnv('SUPABASE_URL');

  if (supabaseUrl) {
    try {
      const hostname = new URL(supabaseUrl).hostname.toLowerCase();

      if (hostname === '127.0.0.1' || hostname === 'localhost') {
        return DEFAULT_LOCAL_IMAGE_CONVERTER_URL;
      }
    } catch {
      // Ignore invalid SUPABASE_URL values and fall through to the config error.
    }
  }

  throw new Error('IMAGE_CONVERTER_URL is not configured for upload-image-files');
}

function getWorkerSecret(): string {
  return readEnv('WORKER_SHARED_SECRET') ?? readEnv('IMAGE_CONVERTER_SHARED_SECRET') ?? '';
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toFilenameBase(imageData: ParsedImageData): string {
  return path.basename(imageData.file.name, path.extname(imageData.file.name));
}

function toImageVariantData(
  imageData: ParsedImageData,
  variant: WorkerImageVariantData,
): ImageVariantData {
  if (
    !variant.filename ||
    !variant.mimeType ||
    !Number.isFinite(variant.width) ||
    variant.width <= 0 ||
    !Number.isFinite(variant.height) ||
    variant.height <= 0
  ) {
    throw new Error('Image conversion worker returned an invalid variant');
  }

  return {
    mimeType: variant.mimeType,
    width: variant.width,
    height: variant.height,
    file: new File([decodeBase64(variant.contentBase64)], variant.filename, {
      type: variant.mimeType,
    }),
    metadata: {
      ...imageData.metadata,
      tags: imageData.tags ?? [],
      alt: imageData.alt,
      width: variant.width,
      height: variant.height,
    },
  };
}

async function requestImageVariants(
  images: ParsedImageData[],
  preset: ImagePreset,
): Promise<WorkerImageVariantsData[]> {
  const formData = new FormData();
  formData.append('preset', preset);

  images.forEach((imageData, index) => {
    formData.append(`file[${index}]`, imageData.file, imageData.file.name);
  });

  const headers = new Headers();
  const workerSecret = getWorkerSecret();

  if (workerSecret) {
    headers.set('x-worker-secret', workerSecret);
  }

  let response: Response;

  try {
    response = await fetch(getWorkerUrl(), {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to reach image conversion worker: ${message}`);
  }

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error(rawBody);
      }

      throw new Error('Image conversion worker returned invalid JSON');
    }
  }

  if (!response.ok) {
    const errorMessage =
      isRecord(parsedBody) && typeof parsedBody.error === 'string'
        ? parsedBody.error
        : rawBody || `Image conversion worker returned HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  if (!isRecord(parsedBody) || !Array.isArray(parsedBody.results)) {
    throw new Error('Image conversion worker returned an invalid response');
  }

  return (parsedBody as WorkerResponseBody).results;
}

export default async function createImageVariants(
  images: ParsedImageData[],
  preset: ImagePreset = DEFAULT_IMAGE_PRESET,
): Promise<ImageVariantsData[]> {
  for (const imageData of images) {
    if (isSvgFile(imageData.file)) {
      throw new Error(
        `File "${imageData.file.name}" is an SVG, which is not supported by magick-wasm in this edge function`,
      );
    }
  }

  const workerResults = await requestImageVariants(images, preset);

  if (workerResults.length !== images.length) {
    throw new Error('Image conversion worker returned an unexpected number of result sets');
  }

  const results = workerResults.map((workerResult, index) => {
    const imageData = images[index];

    if (!imageData || !isRecord(workerResult) || !Array.isArray(workerResult.variants)) {
      throw new Error('Image conversion worker returned an invalid response');
    }

    const variants = workerResult.variants.map((variant) => toImageVariantData(imageData, variant));

    variants.sort(
      (left, right) => left.width - right.width || left.mimeType.localeCompare(right.mimeType),
    );

    return {
      filenameBase:
        typeof workerResult.filenameBase === 'string' && workerResult.filenameBase.length > 0
          ? workerResult.filenameBase
          : toFilenameBase(imageData),
      variants,
    };
  });

  return results;
}
