import ffmpegStatic from 'ffmpeg-static';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ffmpegStaticPath = ffmpegStatic as unknown as string | null;

export default function resolveFfmpegPath(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const binaryName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const candidates = [
    process.env.FFMPEG_PATH,
    ffmpegStaticPath,
    path.resolve(moduleDir, '../../../../node_modules/ffmpeg-static', binaryName),
    path.resolve(process.cwd(), 'node_modules/ffmpeg-static', binaryName),
    binaryName,
  ];

  const resolved = candidates.find(canUsePath);
  if (!resolved) {
    throw new Error(
      'ffmpeg binary not found. Install ffmpeg or set FFMPEG_PATH to a valid executable path.',
    );
  }

  return resolved;
}

function isCommandName(value: string): boolean {
  return !value.includes('/') && !value.includes('\\');
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
