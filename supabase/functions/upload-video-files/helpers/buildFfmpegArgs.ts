import { BASE_FORMAT_ARGS, VIDEO_TRANSCODE_FILTER } from "../constants.ts";
import { FfmpegArgs } from "../types.ts";

export default function buildFfmpegArgs(
  format: FfmpegArgs["-f"],
  args: Partial<Omit<FfmpegArgs, "-f" | "-vf">> = {},
): string[] {
  const fullArgs = {
    ...BASE_FORMAT_ARGS[format],
    ...args,
  } as Omit<FfmpegArgs, "-vf">;

  const result = [];

  const orderedArgs: Array<[string, string | number | boolean | undefined]> = [
    ["-i", fullArgs["-i"]],
    ["-vf", VIDEO_TRANSCODE_FILTER],
    ["-c:v", fullArgs["-c:v"]],
    ["-crf", fullArgs["-crf"]],
    ["-preset", fullArgs["-preset"]],
    ["-b:v", fullArgs["-b:v"]],
    ["-movflags", fullArgs["-movflags"]],
    ["-an", fullArgs["-an"]],
    ["-f", fullArgs["-f"]],
    ["pipe:1", fullArgs["pipe:1"]],
  ];

  for (const [key, value] of orderedArgs) {
    if (value === undefined) {
      continue;
    }

    if (value === true) {
      result.push(key);
    } else {
      result.push(key, value.toString());
    }
  }

  return result;
}
