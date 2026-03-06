import { execa } from "execa";
import { Buffer } from "node:buffer";
import ffmpegStatic from "ffmpeg-static";
import buildFfmpegArgs from "./buildFfmpegArgs.ts";
import { FfmpegArgs } from "../types.ts";
const ffmpegPath = ffmpegStatic as unknown as string;

export default async function convertVideoFile(
  inputFile: File,
  format: FfmpegArgs["-f"],
  width: number,
): Promise<File> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found");
  }

  const { stdout } = await execa(
    ffmpegPath,
    buildFfmpegArgs(format, width),
    {
      input: new Uint8Array(await inputFile.arrayBuffer()),
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 1024, // increase if large videos
    },
  );

  const filename = `${inputFile.name}-${width}.${format}`;

  return new File([Buffer.from(stdout)], filename, {
    type: `video/${format}`,
  });
}
