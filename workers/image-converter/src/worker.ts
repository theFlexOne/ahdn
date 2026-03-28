import { Buffer } from "node:buffer";
import path from "node:path";

import sharp, { type Metadata } from "npm:sharp";

import { IMAGE_ENCODERS, IMAGE_FORMATS, maxUploadBytes, workerSharedSecret } from "./constants.ts";
import type {
  ImageConversionOptions,
  ImageOutputFormat,
  ImageVariantData,
  ImageVariantsData,
  UploadedFile,
} from "./types.ts";

const BAD_REQUEST_MESSAGE_PREFIXES = [
  "Field ",
  "Missing image file",
  "File ",
  "Body must include",
] as const;

type IndexedField = {
  index: number;
  keyName: string;
};

const IMAGE_FORMAT_BY_EXTENSION = new Map<string, ImageOutputFormat>(
  IMAGE_FORMATS.map((format) => [format.extension, format]),
);
const IMAGE_FORMAT_ALIASES = new Map<string, string>([
  ["avif", "avif"],
  [".avif", "avif"],
  ["image/avif", "avif"],
  ["webp", "webp"],
  [".webp", "webp"],
  ["image/webp", "webp"],
  ["jpg", "jpg"],
  [".jpg", "jpg"],
  ["jpeg", "jpg"],
  [".jpeg", "jpg"],
  ["image/jpeg", "jpg"],
]);

export function requireWorkerSecret(req: Request): Response | null {
  if (!workerSharedSecret) {
    return null;
  }

  if (req.headers.get("x-worker-secret") !== workerSharedSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function getIndexedField(key: string): IndexedField | null {
  const indexedMatch = key.match(/^(\w+)\[(\d+)\]$/u);

  if (indexedMatch) {
    const [, keyName, indexValue] = indexedMatch;
    return { keyName, index: Number(indexValue) };
  }

  if (key === "file") {
    return { keyName: "file", index: 0 };
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function getIndexedValues(formData: FormData, key: string): FormDataEntryValue[] {
  const indexedEntries: Array<{ index: number; value: FormDataEntryValue }> = [];
  const indexedPattern = new RegExp(`^${escapeRegExp(key)}\\[(\\d+)\\]$`, "u");

  for (const [entryKey, value] of formData.entries()) {
    const match = entryKey.match(indexedPattern);

    if (!match) {
      continue;
    }

    indexedEntries.push({ index: Number(match[1]), value });
  }

  indexedEntries.sort((left, right) => left.index - right.index);
  return indexedEntries.map((entry) => entry.value);
}

function getStringValues(formData: FormData, key: string, includeIndexed = false): string[] {
  const values = includeIndexed
    ? [...formData.getAll(key), ...getIndexedValues(formData, key)]
    : formData.getAll(key);

  return values.map((value) => {
    if (typeof value !== "string") {
      throw new Error(`Field "${key}" must be a string`);
    }

    return value;
  });
}

function normalizeRequestedFormats(formatValues: string[]): ImageOutputFormat[] {
  if (formatValues.length === 0) {
    throw new Error(`Field "formats" must contain at least one supported format/extension`);
  }

  const normalizedExtensions: string[] = [];

  for (const value of formatValues) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      throw new Error(`Field "formats" must contain supported formats/extensions: avif, webp, jpg`);
    }

    const normalizedExtension = IMAGE_FORMAT_ALIASES.get(normalizedValue);

    if (!normalizedExtension) {
      throw new Error(`Field "formats" must contain supported formats/extensions: avif, webp, jpg`);
    }

    if (!normalizedExtensions.includes(normalizedExtension)) {
      normalizedExtensions.push(normalizedExtension);
    }
  }

  return normalizedExtensions.map((extension) => {
    const format = IMAGE_FORMAT_BY_EXTENSION.get(extension);

    if (!format) {
      throw new Error(`Field "formats" must contain supported formats/extensions: avif, webp, jpg`);
    }

    return format;
  });
}

function normalizeRequestedWidths(widthValues: string[]): number[] {
  if (widthValues.length === 0) {
    throw new Error(`Field "widths" must contain at least one positive integer`);
  }

  const widths: number[] = [];

  for (const value of widthValues) {
    const normalizedValue = value.trim();

    if (!/^\d+$/u.test(normalizedValue)) {
      throw new Error(`Field "widths" must contain positive integers`);
    }

    const width = Number(normalizedValue);

    if (!Number.isSafeInteger(width) || width <= 0) {
      throw new Error(`Field "widths" must contain positive integers`);
    }

    widths.push(width);
  }

  return [...new Set(widths)].sort((left, right) => left - right);
}

export function parseRequestOptions(formData: FormData): ImageConversionOptions {
  return {
    formats: normalizeRequestedFormats(getStringValues(formData, "formats", true)),
    widths: normalizeRequestedWidths(getStringValues(formData, "widths", true)),
  };
}

async function toUploadedFile(file: File): Promise<UploadedFile> {
  if (file.size > maxUploadBytes) {
    throw new Error(`File "${file.name}" exceeds max upload size of ${maxUploadBytes} bytes`);
  }

  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    name: file.name,
    type: file.type,
  };
}

export async function parseMultipartFiles(formData: FormData): Promise<UploadedFile[]> {
  const filesByIndex = new Map<number, UploadedFile>();

  for (const [key, value] of formData.entries()) {
    const match = getIndexedField(key);

    if (!match || match.keyName !== "file") {
      continue;
    }

    if (!(value instanceof File)) {
      throw new Error(`Missing image file for field "${key}"`);
    }

    const file = await toUploadedFile(value);

    if (file.type && !file.type.startsWith("image/")) {
      throw new Error(`File "${file.name}" must be an image`);
    }

    filesByIndex.set(match.index, file);
  }

  return [...filesByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, file]) => file);
}

function getTargetWidths(sourceWidth: number, requestedWidths: number[]): number[] {
  const targetWidths = requestedWidths.filter((width) => width <= sourceWidth);

  if (targetWidths.length > 0) {
    return [...new Set(targetWidths)].sort((left, right) => left - right);
  }

  return [sourceWidth];
}

function isSvgFile(file: UploadedFile): boolean {
  return file.type === "image/svg+xml" || path.extname(file.name).toLowerCase() === ".svg";
}

function getOrientedDimensions(metadata: Metadata): { height: number; width: number } | null {
  if (!metadata.width || !metadata.height) {
    return null;
  }

  const orientation = metadata.orientation ?? 1;

  if ([5, 6, 7, 8].includes(orientation)) {
    return { height: metadata.width, width: metadata.height };
  }

  return { height: metadata.height, width: metadata.width };
}

async function getSourceDimensions(
  sourceBytes: Uint8Array,
): Promise<{ height: number; width: number }> {
  const metadata = await sharp(sourceBytes).metadata();
  const { height = 0, width = 0 } = getOrientedDimensions(metadata) ?? {};
  return { height, width };
}

async function createVariant(
  sourceBytes: Uint8Array,
  filenameBase: string,
  sourceName: string,
  targetWidth: number,
  format: ImageOutputFormat,
): Promise<ImageVariantData> {
  const image = sharp(sourceBytes).rotate().resize({ width: targetWidth, withoutEnlargement: true });

  switch (format.extension) {
    case "avif":
      image.avif(IMAGE_ENCODERS.avif);
      break;
    case "webp":
      image.webp(IMAGE_ENCODERS.webp);
      break;
    case "jpg":
      image.jpeg(IMAGE_ENCODERS.jpg);
      break;
  }

  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  const { height, width } = info;

  if (!width || !height) {
    throw new Error(`Could not determine dimensions for "${sourceName}"`);
  }

  return {
    contentBase64: Buffer.from(data).toString("base64"),
    filename: `${filenameBase}-${width}.${format.extension}`,
    height,
    mimeType: format.mimeType,
    width,
  };
}

async function createImageVariantSet(
  file: UploadedFile,
  options: ImageConversionOptions,
): Promise<ImageVariantsData> {
  if (isSvgFile(file)) {
    throw new Error(`File "${file.name}" is an SVG, which is not supported by this worker`);
  }

  const filenameBase = path.basename(file.name, path.extname(file.name));
  const sourceWidth = (await getSourceDimensions(file.bytes)).width;

  if (!sourceWidth) {
    throw new Error(`Could not determine image width for "${file.name}"`);
  }

  const targetWidths = getTargetWidths(sourceWidth, options.widths);
  const variants = await Promise.all(
    targetWidths.flatMap((targetWidth) =>
      options.formats.map((format) =>
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
  options: ImageConversionOptions,
): Promise<ImageVariantsData[]> {
  const normalizedOptions: ImageConversionOptions = {
    formats: normalizeRequestedFormats(options.formats.map((format) => format.extension)),
    widths: normalizeRequestedWidths(options.widths.map((width) => String(width))),
  };

  return Promise.all(files.map((file) => createImageVariantSet(file, normalizedOptions)));
}

export function getImageErrorStatus(message: string): 400 | 500 {
  return BAD_REQUEST_MESSAGE_PREFIXES.some((prefix) => message.startsWith(prefix)) ? 400 : 500;
}

async function handleConvertRequest(req: Request): Promise<Response> {
  const unauthorizedResponse = requireWorkerSecret(req);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    throw new Error("Body must be multipart form-data");
  }

  const options = parseRequestOptions(formData);
  const files = await parseMultipartFiles(formData);

  if (files.length === 0) {
    return Response.json({ error: "Body must include at least one image file" }, { status: 400 });
  }

  const results = await createImageVariants(files, options);
  return Response.json({ results });
}

function handleWorkerError(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error);
  const status = getImageErrorStatus(message);

  if (status === 500) {
    console.error("Error processing uploaded images:", error);
  }

  return Response.json(
    {
      error: status === 400 ? message : "Failed to process uploaded images",
      ...(status === 500 ? { message } : {}),
    },
    { status },
  );
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/health") {
    return Response.json({ ok: true });
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    return Response.json({ ok: true, service: "image-converter" });
  }

  if (req.method === "GET" && url.pathname === "/") {
    return new Response("image-converter is running\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (req.method === "POST" && url.pathname === "/convert") {
    try {
      return await handleConvertRequest(req);
    } catch (error) {
      return handleWorkerError(error);
    }
  }

  return Response.json({ error: "not found" }, { status: 404 });
}
