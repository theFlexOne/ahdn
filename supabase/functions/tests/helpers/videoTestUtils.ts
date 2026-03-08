export const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) {
    throw new Error(message);
  }
};

export const assertEquals = (
  actual: unknown,
  expected: unknown,
  message?: string,
) => {
  if (!Object.is(actual, expected)) {
    throw new Error(
      message ??
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
    );
  }
};

const fixtureCache = new Map<string, Promise<Uint8Array>>();

type FixtureOptions = {
  width: number;
  height: number;
  durationSeconds?: number;
  fps?: number;
};

export async function commandExists(command: string): Promise<boolean> {
  try {
    const { code } = await new Deno.Command("which", {
      args: [command],
      stdout: "null",
      stderr: "null",
    }).output();

    return code === 0;
  } catch {
    return false;
  }
}

export async function generateMp4Fixture(
  options: FixtureOptions,
): Promise<Uint8Array> {
  const { width, height, durationSeconds = 2, fps = 30 } = options;
  const key = `${width}x${height}-${durationSeconds}s-${fps}fps`;

  if (!fixtureCache.has(key)) {
    fixtureCache.set(key, buildFixture(width, height, durationSeconds, fps));
  }

  return fixtureCache.get(key)!;
}

async function buildFixture(
  width: number,
  height: number,
  durationSeconds: number,
  fps: number,
): Promise<Uint8Array> {
  const outputPath = await Deno.makeTempFile({ suffix: ".mp4" });

  const command = new Deno.Command("ffmpeg", {
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `testsrc=size=${width}x${height}:rate=${fps}`,
      "-t",
      durationSeconds.toString(),
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      "-an",
      "-movflags",
      "+faststart",
      "-f",
      "mp4",
      outputPath,
    ],
  });

  const { code, stderr } = await command.output();
  if (code !== 0) {
    throw new Error(
      `ffmpeg fixture generation failed: ${new TextDecoder().decode(stderr)}`,
    );
  }

  const bytes = await Deno.readFile(outputPath);
  await Deno.remove(outputPath);
  return bytes;
}

export type FfprobeMetadata = {
  streams: Array<Record<string, unknown>>;
  format: Record<string, unknown>;
};

export async function ffprobeJson(path: string): Promise<FfprobeMetadata> {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      path,
    ],
  });

  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    throw new Error(`ffprobe failed: ${new TextDecoder().decode(stderr)}`);
  }

  return JSON.parse(new TextDecoder().decode(stdout)) as FfprobeMetadata;
}

export async function ffprobeBytes(
  bytes: Uint8Array,
  suffix: ".mp4" | ".webm",
): Promise<FfprobeMetadata> {
  const path = await Deno.makeTempFile({ suffix });

  try {
    await Deno.writeFile(path, bytes);
    return await ffprobeJson(path);
  } finally {
    await Deno.remove(path);
  }
}

export function getVideoStream(metadata: FfprobeMetadata) {
  return metadata.streams.find((stream) => stream.codec_type === "video") ?? null;
}
