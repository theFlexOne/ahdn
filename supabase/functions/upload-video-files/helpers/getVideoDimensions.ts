import path from 'node:path';
import resolveFfprobePath from './resolveFfprobePath.ts';

const ffprobePath = resolveFfprobePath();

type FfprobeOutput = {
  streams?: Array<{
    width?: number;
    height?: number;
  }>;
};

export default async function getVideoDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const tempFilePath = await Deno.makeTempFile({
    suffix: path.extname(file.name) || '.mp4',
  });

  try {
    await Deno.writeFile(tempFilePath, new Uint8Array(await file.arrayBuffer()));

    const command = new Deno.Command(ffprobePath, {
      args: [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'json',
        tempFilePath,
      ],
    });
    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      throw new Error(new TextDecoder().decode(stderr));
    }

    const output = JSON.parse(new TextDecoder().decode(stdout)) as FfprobeOutput;
    const stream = output.streams?.[0];

    if (!stream || !Number.isFinite(stream.width) || !Number.isFinite(stream.height)) {
      throw new Error(`Could not determine dimensions for "${file.name}"`);
    }

    return {
      width: Number(stream.width),
      height: Number(stream.height),
    };
  } finally {
    await Deno.remove(tempFilePath).catch(() => {});
  }
}
