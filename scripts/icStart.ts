/**
 * Starts the local image-converter worker in Docker for Supabase function development.
 *
 * What it does:
 * - builds the worker image from `workers/image-converter`
 * - finds the active local Supabase Docker network, unless `--network` is provided
 * - recreates a stable `ahdn-image-converter` container on that network
 * - waits for the worker to report ready, then prints the URL the functions should use
 *
 * The worker is started with a stable container name and network alias so local Edge Functions
 * can reach it at `http://ahdn-image-converter:8080/convert`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';

type EnvMap = Record<string, string>;

type CliOptions = {
  dryRun: boolean;
  networkName?: string;
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');
const WORKER_DIR = join(ROOT_DIR, 'workers/image-converter');
const FUNCTIONS_ENV_PATH = join(ROOT_DIR, 'supabase/functions/.env');
const WORKER_ENV_PATH = join(WORKER_DIR, '.env.local');
const SUPABASE_NETWORK_PREFIX = 'supabase_network_';
const PROJECT_SLUG = toDockerSafeName(basename(ROOT_DIR));
const IMAGE_TAG = `${PROJECT_SLUG}-image-converter-local`;
const CONTAINER_NAME = `${PROJECT_SLUG}-image-converter`;

function toDockerSafeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function printUsage(): void {
  console.log('Usage: npm run ic:start -- [--dry-run] [--network <name>]');
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--network') {
      const networkName = argv[index + 1]?.trim();

      if (!networkName) {
        throw new Error('Missing value for --network');
      }

      options.networkName = networkName;
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readOptionalEnvFile(filePath: string): EnvMap {
  if (!existsSync(filePath)) {
    return {};
  }

  const fileContents = readFileSync(filePath, 'utf8');
  const entries = fileContents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

  return Object.fromEntries(
    entries.flatMap((line) => {
      const equalsIndex = line.indexOf('=');

      if (equalsIndex <= 0) {
        return [];
      }

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return [[key, value]];
    }),
  );
}

function getEnvValue(key: string, ...envMaps: EnvMap[]): string | undefined {
  const processValue = process.env[key]?.trim();

  if (processValue) {
    return processValue;
  }

  for (const envMap of envMaps) {
    const value = envMap[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

async function captureDocker(args: string[], cwd = ROOT_DIR): Promise<string> {
  const result = await execa('docker', args, {
    cwd,
    stderr: 'pipe',
    stdout: 'pipe',
  });

  return result.stdout.trim();
}

async function runDocker(args: string[], cwd = ROOT_DIR): Promise<void> {
  await execa('docker', args, {
    cwd,
    stderr: 'inherit',
    stdout: 'inherit',
  });
}

async function getSupabaseNetworkName(explicitNetworkName?: string): Promise<string> {
  if (explicitNetworkName) {
    return explicitNetworkName;
  }

  const output = await captureDocker(['network', 'ls', '--format', '{{.Name}}']);
  const networkNames = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const projectNetworkName = `${SUPABASE_NETWORK_PREFIX}${PROJECT_SLUG}`;

  if (networkNames.includes(projectNetworkName)) {
    return projectNetworkName;
  }

  const candidateNetworkNames = networkNames.filter((name) => name.startsWith(SUPABASE_NETWORK_PREFIX));

  if (candidateNetworkNames.length === 1) {
    return candidateNetworkNames[0];
  }

  if (candidateNetworkNames.length === 0) {
    throw new Error(
      'Could not find a Supabase Docker network. Run `supabase start` first or pass `--network <name>`.',
    );
  }

  throw new Error(
    `Found multiple Supabase Docker networks: ${candidateNetworkNames.join(
      ', ',
    )}. Pass --network <name> to choose one.`,
  );
}

async function getContainerStatus(containerName: string): Promise<string | null> {
  try {
    const status = await captureDocker(['inspect', '-f', '{{.State.Status}}', containerName]);
    return status || null;
  } catch {
    return null;
  }
}

async function waitForReady(containerName: string, port: number): Promise<void> {
  const readyMessage = `Image worker listening on port ${port}`;
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    const status = await getContainerStatus(containerName);

    if (status !== 'running') {
      const logs = await captureDocker(['logs', '--tail', '40', containerName]).catch(() => '');
      throw new Error(
        `Image conversion worker container exited before becoming ready.${
          logs ? `\nRecent logs:\n${logs}` : ''
        }`,
      );
    }

    const logs = await captureDocker(['logs', '--tail', '40', containerName]).catch(() => '');

    if (logs.includes(readyMessage)) {
      return;
    }

    await new Promise((resolveReadyPoll) => {
      setTimeout(resolveReadyPoll, 500);
    });
  }

  const logs = await captureDocker(['logs', '--tail', '40', containerName]).catch(() => '');
  throw new Error(
    `Timed out waiting for the image conversion worker container to become ready.${
      logs ? `\nRecent logs:\n${logs}` : ''
    }`,
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const workerEnv = readOptionalEnvFile(WORKER_ENV_PATH);
  const functionsEnv = readOptionalEnvFile(FUNCTIONS_ENV_PATH);
  const port = Number(getEnvValue('PORT', workerEnv) ?? 8080);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${String(getEnvValue('PORT', workerEnv) ?? '')}`);
  }

  const networkName = await getSupabaseNetworkName(options.networkName);
  const workerSharedSecret =
    getEnvValue('WORKER_SHARED_SECRET', workerEnv, functionsEnv) ??
    getEnvValue('IMAGE_CONVERTER_SHARED_SECRET', functionsEnv) ??
    '';
  const maxUploadBytes = getEnvValue('MAX_UPLOAD_BYTES', workerEnv);
  const workerUrl = `http://${CONTAINER_NAME}:${port}/convert`;
  const existingStatus = await getContainerStatus(CONTAINER_NAME);

  if (options.dryRun) {
    console.log(`Would build Docker image: ${IMAGE_TAG}`);
    console.log(`Would use Supabase network: ${networkName}`);
    if (existingStatus) {
      console.log(`Would replace existing container: ${CONTAINER_NAME} (${existingStatus})`);
    }
    console.log(`Would start container: ${CONTAINER_NAME}`);
    console.log(`Worker URL for Supabase functions: ${workerUrl}`);
    if (workerSharedSecret) {
      console.log('Would pass WORKER_SHARED_SECRET from local config.');
    }
    if (maxUploadBytes) {
      console.log(`Would pass MAX_UPLOAD_BYTES=${maxUploadBytes}.`);
    }
    return;
  }

  console.log(`Building image ${IMAGE_TAG} from ${WORKER_DIR}`);
  await runDocker(['build', '-t', IMAGE_TAG, '.'], WORKER_DIR);

  if (existingStatus) {
    console.log(`Removing existing container ${CONTAINER_NAME} (${existingStatus})`);
    await runDocker(['rm', '-f', CONTAINER_NAME]);
  }

  const runArgs = [
    'run',
    '--rm',
    '-d',
    '--name',
    CONTAINER_NAME,
    '--network',
    networkName,
    '--network-alias',
    CONTAINER_NAME,
    '-p',
    `${port}:${port}`,
    '-e',
    `PORT=${port}`,
  ];

  if (workerSharedSecret) {
    runArgs.push('-e', `WORKER_SHARED_SECRET=${workerSharedSecret}`);
  }

  if (maxUploadBytes) {
    runArgs.push('-e', `MAX_UPLOAD_BYTES=${maxUploadBytes}`);
  }

  runArgs.push(IMAGE_TAG);

  console.log(`Starting container ${CONTAINER_NAME} on network ${networkName}`);
  await runDocker(runArgs);
  await waitForReady(CONTAINER_NAME, port);

  console.log(`Image converter worker is ready at ${workerUrl}`);
  console.log('Set IMAGE_CONVERTER_URL to that value in supabase/functions/.env if it is not already configured.');
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});
