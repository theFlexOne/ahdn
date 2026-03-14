import type { ParsedVideoData } from "../types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function parseFormData(formData: FormData): ParsedVideoData[] {
  const videoDataByIndex = new Map<number, Partial<ParsedVideoData>>();

  formData.forEach((value, key) => {
    const match = key.match(/^(\w+)\[(\d+)\]$/);

    if (!match) {
      return;
    }

    const [, keyName, indexValue] = match;
    const index = Number(indexValue);
    const videoData = videoDataByIndex.get(index) ?? {};
    videoDataByIndex.set(index, videoData);

    if (keyName === "file") {
      if (!(value instanceof File)) {
        throw new Error(`Field "${key}" must be a file`);
      }

      videoData.file = value;
      return;
    }

    switch (keyName) {
      case "tags":
        if (typeof value !== "string") {
          throw new Error(`Field "${key}" must be a string`);
        }

        videoData.tags ??= [];
        videoData.tags.push(value.trim());
        return;
      case "metadata":
        if (typeof value !== "string") {
          throw new Error(`Field "${key}" must be a JSON string`);
        }

        try {
          const parsedMetadata = JSON.parse(value) as unknown;

          if (!isRecord(parsedMetadata)) {
            throw new Error("metadata must be a JSON object");
          }

          videoData.metadata = parsedMetadata;
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : String(error);
          throw new Error(`Field "${key}" is invalid: ${message}`);
        }

        return;
      default:
        console.warn(`Unknown form-data key: ${keyName}`);
    }
  });

  return [...videoDataByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([index, videoData]) => {
      if (!(videoData.file instanceof File)) {
        throw new Error(`Missing video file for index ${index}`);
      }

      if (videoData.file.type && !videoData.file.type.startsWith("video/")) {
        throw new Error(`File "${videoData.file.name}" must be a video`);
      }

      return {
        file: videoData.file,
        tags: videoData.tags?.filter((tag) => tag.length > 0) ?? [],
        metadata: videoData.metadata ?? {},
      };
    });
}
