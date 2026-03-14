import path from "node:path";
import { DEFAULT_VIDEO_FORMATS } from "../constants.ts";
import { ParsedVideoData, VideoFormat, VideoVariantsData } from "../types.ts";
import convertVideoFile from "./convertVideoFile.ts";
import getVideoDimensions from "./getVideoDimensions.ts";

export default function convertVideoFiles(
  videos: ParsedVideoData[],
  formats: readonly VideoFormat[] = DEFAULT_VIDEO_FORMATS,
): Promise<VideoVariantsData[]> {
  return Promise.all(
    videos.map(async (video) => {
      const filenameBase = path.basename(
        video.file.name,
        path.extname(video.file.name),
      );
      const variants = await Promise.all(
        formats.map(async (format) => {
          const file = await convertVideoFile(video.file, format);
          const dimensions = await getVideoDimensions(file);

          return {
            mimeType: file.type as `video/${VideoFormat}`,
            width: dimensions.width,
            height: dimensions.height,
            file,
            metadata: {
              ...video.metadata,
              tags: video.tags ?? [],
              width: dimensions.width,
              height: dimensions.height,
            },
          };
        }),
      );

      variants.sort((left, right) =>
        left.mimeType.localeCompare(right.mimeType)
      );

      return {
        filenameBase,
        variants,
      };
    }),
  );
}
