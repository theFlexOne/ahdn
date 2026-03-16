import path from "node:path";
import { fileURLToPath } from "node:url";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import multer from "multer";
import sharp, { type Metadata } from "sharp";

export const app = express();
const port = Number(process.env.PORT ?? 8080);
const workerSharedSecret = process.env.WORKER_SHARED_SECRET?.trim() ?? "";
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 20 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes },
});

const IMAGE_PRESETS = {
  thumbnail: { sm: 240, md: 400, lg: 640 },
  content: { sm: 600, md: 900, lg: 1440 },
  hero: { sm: 768, md: 1280, lg: 1920 },
} as const;

const DEFAULT_IMAGE_PRESET = "content" as const;
const IMAGE_PRESET_KEYS = Object.keys(IMAGE_PRESETS) as Array<
  keyof typeof IMAGE_PRESETS
>;

const IMAGE_FORMATS = [
  { extension: "avif", mimeType: "image/avif" },
  { extension: "webp", mimeType: "image/webp" },
  { extension: "jpg", mimeType: "image/jpeg" },
] as const;

const IMAGE_ENCODERS = {
  avif: { quality: 45, effort: 6 },
  webp: { quality: 75 },
  jpg: { quality: 82, mozjpeg: true },
} as const;

type ImagePreset = keyof typeof IMAGE_PRESETS;
type ImageVariantMimeType = typeof IMAGE_FORMATS[number]["mimeType"];
type MultipartBody = Record<string, unknown>;

export type UploadedFile = {
  name: string;
  type: string;
  bytes: Uint8Array;
};

type ImageVariantData = {
  mimeType: ImageVariantMimeType;
  width: number;
  height: number;
  filename: string;
  contentBase64: string;
};

type ImageVariantsData = {
  filenameBase: string;
  variants: ImageVariantData[];
};

function requireWorkerSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!workerSharedSecret) {
    next();
    return;
  }

  if (req.get("x-worker-secret") !== workerSharedSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isImagePreset(value: string): value is ImagePreset {
  return IMAGE_PRESET_KEYS.includes(value as ImagePreset);
}

function getIndexedField(
  key: string,
): { keyName: string; index: number } | null {
  const indexedMatch = key.match(/^(\w+)\[(\d+)\]$/);

  if (indexedMatch) {
    const [, keyName, indexValue] = indexedMatch;
    return { keyName, index: Number(indexValue) };
  }

  if (key === "file") {
    return { keyName: "file", index: 0 };
  }

  return null;
}

function getStringValues(value: unknown, key: string): string[] {
  if (value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => getStringValues(entry, key));
  }

  throw new Error(`Field "${key}" must be a string`);
}

export function parseRequestOptions(
  body: MultipartBody,
): { preset: ImagePreset } {
  const [presetValue] = getStringValues(body.preset, "preset");
  const normalizedPreset = presetValue?.trim() || DEFAULT_IMAGE_PRESET;

  if (!isImagePreset(normalizedPreset)) {
    throw new Error(
      `Field "preset" must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
    );
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

export function parseMultipartFiles(
  files: Express.Multer.File[],
): UploadedFile[] {
  const filesByIndex = new Map<number, UploadedFile>();

  for (const file of files) {
    const match = getIndexedField(file.fieldname);

    if (!match || match.keyName !== "file") {
      continue;
    }

    filesByIndex.set(match.index, toUploadedFile(file));
  }

  return [...filesByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, file]) => {
      if (file.type && !file.type.startsWith("image/")) {
        throw new Error(`File "${file.name}" must be an image`);
      }

      return file;
    });
}

function getTargetWidths(sourceWidth: number, preset: ImagePreset): number[] {
  const presetWidths = Object.values(IMAGE_PRESETS[preset]).filter((width) =>
    width <= sourceWidth
  );

  if (presetWidths.length > 0) {
    return [...new Set(presetWidths)];
  }

  return [sourceWidth];
}

function isSvgFile(file: UploadedFile): boolean {
  return file.type === "image/svg+xml" ||
    path.extname(file.name).toLowerCase() === ".svg";
}

function getOrientedDimensions(
  metadata: Metadata,
): { width: number; height: number } | null {
  if (!metadata.width || !metadata.height) {
    return null;
  }

  const orientation = metadata.orientation ?? 1;

  if ([5, 6, 7, 8].includes(orientation)) {
    return { width: metadata.height, height: metadata.width };
  }

  return { width: metadata.width, height: metadata.height };
}

async function getSourceWidth(sourceBytes: Uint8Array): Promise<number> {
  const metadata = await sharp(sourceBytes).metadata();
  return getOrientedDimensions(metadata)?.width ?? 0;
}

async function createVariant(
  sourceBytes: Uint8Array,
  filenameBase: string,
  sourceName: string,
  targetWidth: number,
  format: typeof IMAGE_FORMATS[number],
): Promise<ImageVariantData> {
  const image = sharp(sourceBytes)
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: true });

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
  const width = info.width ?? targetWidth;
  const height = info.height ?? 0;

  if (!height) {
    throw new Error(`Could not determine dimensions for "${sourceName}"`);
  }

  return {
    mimeType: format.mimeType,
    width,
    height,
    filename: `${filenameBase}-${width}.${format.extension}`,
    contentBase64: data.toString("base64"),
  };
}

async function createImageVariantSet(
  file: UploadedFile,
  preset: ImagePreset,
): Promise<ImageVariantsData> {
  if (isSvgFile(file)) {
    throw new Error(
      `File "${file.name}" is an SVG, which is not supported by this worker`,
    );
  }

  const filenameBase = path.basename(
    file.name,
    path.extname(file.name),
  );
  const sourceWidth = await getSourceWidth(file.bytes);

  if (!sourceWidth) {
    throw new Error(
      `Could not determine image width for "${file.name}"`,
    );
  }

  const targetWidths = getTargetWidths(sourceWidth, preset);
  const variants = await Promise.all(
    targetWidths.flatMap((targetWidth) =>
      IMAGE_FORMATS.map((format) =>
        createVariant(
          file.bytes,
          filenameBase,
          file.name,
          targetWidth,
          format,
        )
      )
    ),
  );

  variants.sort((left, right) =>
    left.width - right.width || left.mimeType.localeCompare(right.mimeType)
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
  return Promise.all(
    files.map((file) => createImageVariantSet(file, preset)),
  );
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/convert",
  requireWorkerSecret,
  upload.any(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = isRecord(req.body) ? req.body : {};
      const files = Array.isArray(req.files) ? req.files : [];
      const options = parseRequestOptions(body);
      const parsedFiles = parseMultipartFiles(files);

      if (parsedFiles.length === 0) {
        res.status(400).json(
          { error: "Body must include at least one image file" },
        );
        return;
      }

      const results = await createImageVariants(parsedFiles, options.preset);

      res.json({ results });
    } catch (error) {
      next(error);
    }
  },
);

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Field ") ||
        message.startsWith("Missing image file") ||
        message.startsWith("File ") ||
        message.startsWith("Body must include")
      ? 400
      : 500;

    if (status === 500) {
      console.error("Error processing uploaded images:", error);
    }

    res.status(status).json({
      error: status === 400 ? message : "Failed to process uploaded images",
      ...(status === 500 ? { message } : {}),
    });
  },
);

const isDirectRun = process.env.NODE_ENV !== "test" &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Image worker listening on port ${port}`);
  });
}
