import { execa } from "execa";
import buildFfmpegArgs from "./buildFfmpegArgs.ts";
import { FfmpegArgs } from "../types.ts";
import resolveFfmpegPath from "./resolveFfmpegPath.ts";
import path from "node:path";

const ffmpegPath = resolveFfmpegPath();

export default async function convertVideoFile(
  inputFile: File,
  format: FfmpegArgs["-f"],
): Promise<File> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found");
  }

  const { stdout } = await execa(
    ffmpegPath,
    buildFfmpegArgs(format),
    {
      input: new Uint8Array(await inputFile.arrayBuffer()),
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 1024, // increase if large videos
    },
  );

  const filenameBase = path.basename(
    inputFile.name,
    path.extname(inputFile.name),
  );

  const filename = `${filenameBase}.${format}`;

  return new File([Uint8Array.from(stdout)], filename, {
    type: `video/${format}`,
  });
}
