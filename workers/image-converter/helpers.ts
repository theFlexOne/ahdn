import path from 'node:path';

import { type NextFunction, type Request, type Response } from 'express';
import sharp, { type Metadata } from 'sharp';

import {
  DEFAULT_IMAGE_PRESET,
  IMAGE_ENCODERS,
  IMAGE_FORMATS,
  IMAGE_PRESETS,
  IMAGE_PRESET_KEYS,
  workerSharedSecret,
} from './constants.js';
import type {
  ImagePreset,
  ImageVariantData,
  ImageVariantsData,
  MultipartBody,
  UploadedFile,
} from './types.js';

const BAD_REQUEST_MESSAGE_PREFIXES = [
  'Field ',
  'Missing image file',
  'File ',
  'Body must include',
] as const;

export function requireWorkerSecret(req: Request, res: Response, next: NextFunction): void {
  if (!workerSharedSecret) {
    next();
    return;
  }

  if (req.get('x-worker-secret') !== workerSharedSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isImagePreset(value: string): value is ImagePreset {
  return IMAGE_PRESET_KEYS.includes(value as ImagePreset);
}

function getIndexedField(key: string): { keyName: string; index: number } | null {
  const indexedMatch = key.match(/^(\w+)\[(\d+)\]$/);

  if (indexedMatch) {
    const [, keyName, indexValue] = indexedMatch;
    return { keyName, index: Number(indexValue) };
  }

  if (key === 'file') {
    return { keyName: 'file', index: 0 };
  }

  return null;
}

function getStringValues(value: unknown, key: string): string[] {
  if (value === undefined) {
    return [];
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => getStringValues(entry, key));
  }

  throw new Error(`Field "${key}" must be a string`);
}

export function parseRequestOptions(body: MultipartBody): { preset: ImagePreset } {
  const [presetValue] = getStringValues(body.preset, 'preset');
  const normalizedPreset = presetValue?.trim() || DEFAULT_IMAGE_PRESET;

  if (!isImagePreset(normalizedPreset)) {
    throw new Error(`Field "preset" must be one of: ${IMAGE_PRESET_KEYS.join(', ')}`);
  }

  return { preset: normalizedPreset };
}

function toUploadedFile(file: Express.Multer.File): UploadedFile {
  return {
    name: file.originalname,
    type: file.mimetype,
    bytes: Uint8Array.from(file.buffer),
  };
}

export function parseMultipartFiles(files: Express.Multer.File[]): UploadedFile[] {
  const filesByIndex = new Map<number, UploadedFile>();

  for (const file of files) {
    const match = getIndexedField(file.fieldname);

    if (!match || match.keyName !== 'file') {
      continue;
    }

    filesByIndex.set(match.index, toUploadedFile(file));
  }

  return [...filesByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, file]) => {
      if (file.type && !file.type.startsWith('image/')) {
        throw new Error(`File "${file.name}" must be an image`);
      }

      return file;
    });
}

function getTargetWidths(sourceWidth: number, preset: ImagePreset): number[] {
  const presetWidths = Object.values(IMAGE_PRESETS[preset]).filter((width) => width <= sourceWidth);

  if (presetWidths.length > 0) {
    return [...new Set(presetWidths)];
  }

  return [sourceWidth];
}

function isSvgFile(file: UploadedFile): boolean {
  return file.type === 'image/svg+xml' || path.extname(file.name).toLowerCase() === '.svg';
}

function getOrientedDimensions(metadata: Metadata): { width: number; height: number } | null {
  if (!metadata.width || !metadata.height) {
    return null;
  }

  const orientation = metadata.orientation ?? 1;

  if ([5, 6, 7, 8].includes(orientation)) {
    return { width: metadata.height, height: metadata.width };
  }

  return { width: metadata.width, height: metadata.height };
}

async function getSourceDimensions(
  sourceBytes: Uint8Array,
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(sourceBytes).metadata();
  const { width = 0, height = 0 } = getOrientedDimensions(metadata) ?? {};
  return { width, height };
}

async function createVariant(
  sourceBytes: Uint8Array,
  filenameBase: string,
  sourceName: string,
  targetWidth: number,
  format: (typeof IMAGE_FORMATS)[number],
): Promise<ImageVariantData> {
  const image = sharp(sourceBytes)
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: true });

  switch (format.extension) {
    case 'avif':
      image.avif(IMAGE_ENCODERS.avif);
      break;
    case 'webp':
      image.webp(IMAGE_ENCODERS.webp);
      break;
    case 'jpg':
      image.jpeg(IMAGE_ENCODERS.jpg);
      break;
  }

  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  if (!width || !height) {
    throw new Error(`Could not determine dimensions for "${sourceName}"`);
  }

  return {
    mimeType: format.mimeType,
    width,
    height,
    filename: `${filenameBase}-${width}.${format.extension}`,
    contentBase64: data.toString('base64'),
  };
}

async function createImageVariantSet(
  file: UploadedFile,
  preset: ImagePreset,
): Promise<ImageVariantsData> {
  if (isSvgFile(file)) {
    throw new Error(`File "${file.name}" is an SVG, which is not supported by this worker`);
  }

  const filenameBase = path.basename(file.name, path.extname(file.name));
  const sourceWidth = (await getSourceDimensions(file.bytes)).width;

  if (!sourceWidth) {
    throw new Error(`Could not determine image width for "${file.name}"`);
  }

  const targetWidths = getTargetWidths(sourceWidth, preset);
  const variants = await Promise.all(
    targetWidths.flatMap((targetWidth) =>
      IMAGE_FORMATS.map((format) =>
        createVariant(file.bytes, filenameBase, file.name, targetWidth, format),
      ),
    ),
  );

  variants.sort(
    (left, right) => left.width - right.width || left.mimeType.localeCompare(right.mimeType),
  );

  return {
    filenameBase,
    variants,
  };
}

export function createImageVariants(
  files: UploadedFile[],
  preset: ImagePreset = DEFAULT_IMAGE_PRESET,
): Promise<ImageVariantsData[]> {
  return Promise.all(files.map((file) => createImageVariantSet(file, preset)));
}

export function getImageErrorStatus(message: string): 400 | 500 {
  return BAD_REQUEST_MESSAGE_PREFIXES.some((prefix) => message.startsWith(prefix)) ? 400 : 500;
}
