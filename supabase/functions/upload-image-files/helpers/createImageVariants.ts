import path from "node:path";
import {
  ImageMagick,
  MagickFormat,
  MagickGeometry,
} from "@imagemagick/magick-wasm";
import {
  DEFAULT_IMAGE_PRESET,
  IMAGE_ENCODERS,
  IMAGE_FORMATS,
  IMAGE_PRESETS,
} from "../constants.ts";
import initializeBundledImageMagick from "./initializeImageMagick.ts";

import type {
  ImagePreset,
  ImageVariantData,
  ImageVariantExtension,
  ImageVariantsData,
  ParsedImageData,
} from "../types.ts";

const IMAGE_MAGICK_FORMATS: Record<ImageVariantExtension, MagickFormat> = {
  avif: MagickFormat.Avif,
  webp: MagickFormat.WebP,
  jpg: MagickFormat.Jpeg,
};

function getTargetWidths(sourceWidth: number, preset: ImagePreset): number[] {
  const presetWidths = Object.values(IMAGE_PRESETS[preset]).filter((width) =>
    width <= sourceWidth
  );

  if (presetWidths.length > 0) {
    return [...new Set(presetWidths)];
  }

  return [sourceWidth];
}

function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" ||
    path.extname(file.name).toLowerCase() === ".svg";
}

function getResizeGeometry(targetWidth: number): MagickGeometry {
  const geometry = new MagickGeometry(`${targetWidth}x`);
  geometry.greater = true;
  return geometry;
}

function getSourceWidth(sourceBytes: Uint8Array): number {
  return ImageMagick.read(sourceBytes, (image) => {
    image.autoOrient();
    return image.width;
  });
}

function createVariant(
  sourceBytes: Uint8Array,
  imageData: ParsedImageData,
  filenameBase: string,
  targetWidth: number,
  format: typeof IMAGE_FORMATS[number],
): ImageVariantData {
  return ImageMagick.read(sourceBytes, (image) => {
    image.autoOrient();
    image.resize(getResizeGeometry(targetWidth));
    image.quality = IMAGE_ENCODERS[format.extension].quality;

    return image.write(IMAGE_MAGICK_FORMATS[format.extension], (data) => {
      const width = image.width;
      const height = image.height;

      return {
        mimeType: format.mimeType,
        width,
        height,
        file: new File(
          [Uint8Array.from(data)],
          `${filenameBase}-${width}.${format.extension}`,
          { type: format.mimeType },
        ),
        metadata: {
          ...imageData.metadata,
          tags: imageData.tags ?? [],
          alt: imageData.alt,
          width,
          height,
        },
      };
    });
  });
}

async function createImageVariantSet(
  imageData: ParsedImageData,
  preset: ImagePreset,
): Promise<ImageVariantsData> {
  await initializeBundledImageMagick();

  if (isSvgFile(imageData.file)) {
    throw new Error(
      `File "${imageData.file.name}" is an SVG, which is not supported by magick-wasm in this edge function`,
    );
  }

  const filenameBase = path.basename(
    imageData.file.name,
    path.extname(imageData.file.name),
  );
  const sourceBytes = new Uint8Array(await imageData.file.arrayBuffer());
  const sourceWidth = getSourceWidth(sourceBytes);

  if (!sourceWidth) {
    throw new Error(
      `Could not determine image width for "${imageData.file.name}"`,
    );
  }

  const targetWidths = getTargetWidths(sourceWidth, preset);
  const variants = await Promise.all(
    targetWidths.flatMap((targetWidth) =>
      IMAGE_FORMATS.map((format) =>
        createVariant(sourceBytes, imageData, filenameBase, targetWidth, format)
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

export default function createImageVariants(
  images: ParsedImageData[],
  preset: ImagePreset = DEFAULT_IMAGE_PRESET,
): Promise<ImageVariantsData[]> {
  return Promise.all(
    images.map((imageData) => createImageVariantSet(imageData, preset)),
  );
}
