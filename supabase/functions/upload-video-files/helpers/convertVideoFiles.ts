import { BASE_FORMATS, BASE_SIZES } from "../constants.ts";
import {
  FileVariantsWithMetadata,
  VideoFileWithMetadata,
  VideoFormat,
  VideoSize,
} from "../types.ts";
import convertVideoFile from "./convertVideoFile.ts";

export default function convertVideoFiles(
  videos: VideoFileWithMetadata[],
  formats: readonly VideoFormat[] = BASE_FORMATS,
  sizes: readonly VideoSize[] = BASE_SIZES,
): Promise<FileVariantsWithMetadata[]> {
  return Promise.all(
    videos.map(async (video) => ({
      files: await convertFileVariants(video.file, formats, sizes),
      metadata: video.metadata,
    })),
  );
}

function convertFileVariants(
  file: File,
  formats: readonly VideoFormat[],
  sizes: readonly VideoSize[],
): Promise<File[]> {
  return Promise.all(
    formats.flatMap((format) =>
      sizes.map((size) => convertVideoFile(file, format, size))
    ),
  );
}
