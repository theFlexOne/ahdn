import { BASE_FORMAT_ARGS } from "../constants.ts";
import { FfmpegArgs } from "../types.ts";

export default function buildFfmpegArgs(
  format: FfmpegArgs["-f"],
  width: number,
  args: Partial<Omit<FfmpegArgs, "-f" | "-vf">> = {},
): string[] {
  const fullArgs = {
    ...BASE_FORMAT_ARGS[format],
    ...args,
    "-vf": `scale=${width}:-2:flags=lanczos,fps=30`,
  } as FfmpegArgs;

  const result = [];

  for (const [key, value] of Object.entries(fullArgs)) {
    if (value === true) {
      result.push(key);
    } else {
      result.push(key, value.toString());
    }
  }

  return result;
}
