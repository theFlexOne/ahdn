import ffmpegStatic from "ffmpeg-static";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ffmpegStaticPath = ffmpegStatic as unknown as string | null;

export default function resolveFfprobePath(): string {
  const binaryName = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const candidates = [
    process.env.FFPROBE_PATH,
    process.env.FFMPEG_PATH
      ? path.resolve(path.dirname(process.env.FFMPEG_PATH), binaryName)
      : null,
    ffmpegStaticPath
      ? path.resolve(path.dirname(ffmpegStaticPath), binaryName)
      : null,
    path.resolve(process.cwd(), "node_modules/ffmpeg-static", binaryName),
    binaryName,
  ];

  const resolved = candidates.find(canUsePath);

  if (!resolved) {
    throw new Error(
      "ffprobe binary not found. Install ffprobe or set FFPROBE_PATH to a valid executable path.",
    );
  }

  return resolved;
}

function isCommandName(value: string): boolean {
  return !value.includes("/") && !value.includes("\\");
}

function canUsePath(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  if (isCommandName(value)) {
    return true;
  }

  try {
    return fs.existsSync(value);
  } catch {
    return false;
  }
}
