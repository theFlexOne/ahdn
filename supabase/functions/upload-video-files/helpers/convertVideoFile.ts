import { execa } from "execa";
import { Buffer } from "node:buffer";
import buildFfmpegArgs from "./buildFfmpegArgs.ts";
import { FfmpegArgs } from "../types.ts";
import fs from "node:fs";
import resolveFfmpegPath from "./resolveFfmpegPath.ts";
import path from "node:path";

const ffmpegPath = resolveFfmpegPath();

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

  const filenameBase = path.basename(
    inputFile.name,
    path.extname(inputFile.name),
  );

  const filename = `${filenameBase}-${width}.${format}`;

  return new File([Buffer.from(stdout)], filename, {
    type: `video/${format}`,
  });
}

async function main() {
  const inputFileBuffer = fs.readFileSync("bg_hero_vid.h264.mp4");
  const inputFile = new File([inputFileBuffer], "bg_hero_vid.h264.mp4");
  const outputFile = await convertVideoFile(inputFile, "webm", 1280);
  console.log({
    name: outputFile.name,
    type: outputFile.type,
    size: outputFile.size,
  });
}

if (import.meta.main) {
  await main();
}
