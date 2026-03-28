import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

import { execa } from 'execa';

import {
  type FunctionsInspectMode,
  LOCAL_FUNCTIONS_ENV_PATH,
  PROJECT_SLUG,
  ROOT_DIR,
  WORKER_DIR,
  captureCombinedCommandOutput,
  captureCommandOutput,
  formatEnvValue,
  logStep,
  readOptionalEnvFile,
  runCommand,
  sleep,
} from './shared.ts';

type FunctionsServeOptions = {
  envFilePath?: string;
  inspectMode?: FunctionsInspectMode | null;
  noVerifyJwt?: boolean;
};

export type BackgroundProcess = {
  outputChunks: string[];
  settled: Promise<void>;
  subprocess: ReturnType<typeof execa>;
};

export type ManagedImageWorker = {
  containerName: string;
  envFilePath: string;
  envFileDirectory: string;
};

const SUPABASE_CONTAINER_PREFIX = 'supabase_';
const SUPABASE_NETWORK_PREFIX = 'supabase_network_';
const EDGE_RUNTIME_CONTAINER_PREFIX = `${SUPABASE_CONTAINER_PREFIX}edge_runtime_`;
const EDGE_RUNTIME_CONTAINER_NAME = `${EDGE_RUNTIME_CONTAINER_PREFIX}${PROJECT_SLUG}`;
const SUPABASE_CORE_CONTAINER_NAMES = [
  `${SUPABASE_CONTAINER_PREFIX}kong_${PROJECT_SLUG}`,
  `${SUPABASE_CONTAINER_PREFIX}db_${PROJECT_SLUG}`,
  `${SUPABASE_CONTAINER_PREFIX}rest_${PROJECT_SLUG}`,
  `${SUPABASE_CONTAINER_PREFIX}storage_${PROJECT_SLUG}`,
  `${SUPABASE_CONTAINER_PREFIX}auth_${PROJECT_SLUG}`,
];
const IMAGE_WORKER_IMAGE_TAG = `${PROJECT_SLUG}-image-converter-integration`;
const IMAGE_WORKER_CONTAINER_PREFIX = `${PROJECT_SLUG}-image-converter-integration`;
const IMAGE_WORKER_PORT = 8080;
const IMAGE_WORKER_READY_MESSAGE = `Image worker listening on port ${IMAGE_WORKER_PORT}`;
const FUNCTION_HEALTH_URLS = [
  'http://127.0.0.1:54321/functions/v1/upload-image-files',
  'http://127.0.0.1:54321/functions/v1/upload-video-files',
];

export async function startSupabaseFunctionsServe(
  options: FunctionsServeOptions = {},
): Promise<BackgroundProcess> {
  const { envFilePath, inspectMode = null, noVerifyJwt = false } = options;
  logStep('Starting Supabase function runtime');
  const args = ['functions', 'serve'];

  if (inspectMode) {
    args.push('--inspect-mode', inspectMode);
  }

  if (envFilePath) {
    args.push('--env-file', envFilePath);
  }

  if (noVerifyJwt) {
    args.push('--no-verify-jwt');
  }

  console.log(`supabase ${args.join(' ')}`);

  const outputChunks: string[] = [];
  const subprocess = execa('supabase', args, {
    all: true,
    cleanup: true,
    cwd: ROOT_DIR,
    forceKillAfterDelay: 5_000,
  });

  subprocess.all?.setEncoding('utf8');
  subprocess.all?.on('data', (chunk: string | Uint8Array) => {
    outputChunks.push(String(chunk));

    if (outputChunks.length > 40) {
      outputChunks.shift();
    }
  });

  return {
    outputChunks,
    settled: subprocess.then(() => undefined).catch(() => undefined),
    subprocess,
  };
}

export async function waitForFunctionsReady(
  backgroundProcess: BackgroundProcess,
  inspectMode: FunctionsInspectMode | null = null,
): Promise<void> {
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    if (backgroundProcess.subprocess.exitCode !== null) {
      throw new Error(
        `Supabase function runtime exited before becoming ready.${getProcessOutputTail(
          backgroundProcess.outputChunks,
        )}`,
      );
    }

    if (!isSupabaseFunctionsServeReady(backgroundProcess.outputChunks, inspectMode)) {
      await sleep(500);
      continue;
    }

    if (inspectMode === 'wait') {
      return;
    }

    for (const url of FUNCTION_HEALTH_URLS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1_500);

      try {
        await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        return;
      } catch {
        // Keep polling until the function runtime starts accepting requests.
      } finally {
        clearTimeout(timeout);
      }
    }

    await sleep(500);
  }

  throw new Error(
    `Timed out waiting for Supabase functions to start.${getProcessOutputTail(
      backgroundProcess.outputChunks,
    )}`,
  );
}

export async function promptForDebuggerAttach(
  backgroundProcess: BackgroundProcess,
): Promise<void> {
  console.log(`
Edge debug mode is waiting for Chrome DevTools.

1. Open chrome://inspect
2. Click "Configure..." and add ${getDebuggerTarget(backgroundProcess.outputChunks)}
3. Open the dedicated DevTools window and set your breakpoint
4. Press Enter here to start the integration test
`);

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await readline.question('Press Enter when Chrome DevTools is ready...');
  } finally {
    readline.close();
  }
}

export async function stopSupabaseFunctionsServe(
  backgroundProcess: BackgroundProcess | undefined,
): Promise<void> {
  if (!backgroundProcess) {
    return;
  }

  if (backgroundProcess.subprocess.exitCode === null) {
    logStep('Stopping Supabase function runtime');
    backgroundProcess.subprocess.kill('SIGTERM');
  }

  await backgroundProcess.settled;
}

export async function startImageWorker(): Promise<ManagedImageWorker> {
  const localFunctionEnv = readOptionalEnvFile(LOCAL_FUNCTIONS_ENV_PATH);
  const workerSharedSecret =
    process.env.WORKER_SHARED_SECRET?.trim() ||
    process.env.IMAGE_CONVERTER_SHARED_SECRET?.trim() ||
    localFunctionEnv.WORKER_SHARED_SECRET ||
    localFunctionEnv.IMAGE_CONVERTER_SHARED_SECRET ||
    '';

  await runCommand(
    'Building image conversion worker container',
    'docker',
    ['build', '-t', IMAGE_WORKER_IMAGE_TAG, '.'],
    { cwd: WORKER_DIR },
  );

  const networkName = await getSupabaseNetworkName();
  const containerName = `${IMAGE_WORKER_CONTAINER_PREFIX}-${Date.now()}`;
  const args = ['run', '--rm', '-d', '--name', containerName, '--network', networkName];

  if (workerSharedSecret) {
    args.push('-e', `WORKER_SHARED_SECRET=${workerSharedSecret}`);
  }

  args.push(IMAGE_WORKER_IMAGE_TAG);

  await runCommand('Starting image conversion worker container', 'docker', args, {
    cwd: ROOT_DIR,
  });

  await waitForImageWorkerReady(containerName);

  const { envFileDirectory, envFilePath } = createFunctionsEnvFile(
    `http://${containerName}:${IMAGE_WORKER_PORT}/convert`,
  );

  return {
    containerName,
    envFilePath,
    envFileDirectory,
  };
}

export async function stopImageWorker(worker: ManagedImageWorker | undefined): Promise<void> {
  if (!worker) {
    return;
  }

  try {
    const status = await captureCommandOutput('docker', [
      'inspect',
      '-f',
      '{{.State.Status}}',
      worker.containerName,
    ]).catch(() => '');

    if (status === 'running') {
      logStep('Stopping image conversion worker container');
      await execa('docker', ['stop', worker.containerName], {
        cwd: ROOT_DIR,
        stderr: 'inherit',
        stdout: 'inherit',
      });
    }
  } finally {
    rmSync(worker.envFileDirectory, { force: true, recursive: true });
  }
}

function getProcessOutputTail(outputChunks: string[]): string {
  const tail = outputChunks.join('').trim();

  if (!tail) {
    return '';
  }

  return `\nRecent output from "supabase functions serve":\n${tail}`;
}

function isSupabaseFunctionsServeReady(
  outputChunks: string[],
  inspectMode: FunctionsInspectMode | null = null,
): boolean {
  const output = outputChunks.join('');

  const isServing =
    output.includes('Serving functions on') && output.includes('Using supabase-edge-runtime');

  if (!isServing) {
    return false;
  }

  if (!inspectMode) {
    return true;
  }

  return output.includes('Debugger listening on ws://');
}

function getDebuggerTarget(outputChunks: string[]): string {
  const match = outputChunks
    .join('')
    .match(/Debugger listening on ws:\/\/(?:0\.0\.0\.0|127\.0\.0\.1):(\d+)/u);

  return match ? `127.0.0.1:${match[1]}` : '127.0.0.1:8083';
}

async function getRunningContainerNames(): Promise<string[]> {
  return (await captureCommandOutput('docker', ['ps', '--format', '{{.Names}}']))
    .split(/\r?\n/u)
    .map((name) => name.trim())
    .filter(Boolean);
}

function isSupabaseProjectContainerName(containerName: string): boolean {
  return (
    containerName.startsWith(SUPABASE_CONTAINER_PREFIX) &&
    containerName.endsWith(`_${PROJECT_SLUG}`)
  );
}

async function getContainerNetworkNames(containerName: string): Promise<string[]> {
  const networkNames = (
    await captureCommandOutput('docker', [
      'inspect',
      '-f',
      '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}',
      containerName,
    ])
  )
    .split(/\r?\n/u)
    .map((name) => name.trim())
    .filter(Boolean);

  if (networkNames.length === 0) {
    throw new Error(`Container "${containerName}" is not attached to a Docker network.`);
  }

  return networkNames;
}

async function getSupabaseNetworkName(): Promise<string> {
  const containerNames = await getRunningContainerNames();
  const candidateContainerNames = [
    EDGE_RUNTIME_CONTAINER_NAME,
    ...SUPABASE_CORE_CONTAINER_NAMES,
    ...containerNames.filter(isSupabaseProjectContainerName),
  ];
  const seenContainerNames = new Set<string>();

  for (const containerName of candidateContainerNames) {
    if (!containerNames.includes(containerName) || seenContainerNames.has(containerName)) {
      continue;
    }

    seenContainerNames.add(containerName);

    const networkNames = await getContainerNetworkNames(containerName);
    const supabaseNetworkName = networkNames.find((name) =>
      name.startsWith(SUPABASE_NETWORK_PREFIX),
    );

    if (supabaseNetworkName) {
      return supabaseNetworkName;
    }

    if (networkNames.length === 1) {
      return networkNames[0];
    }
  }

  const runningProjectContainers = containerNames.filter(isSupabaseProjectContainerName);

  if (runningProjectContainers.length === 0) {
    throw new Error(
      'Could not find a running Supabase container to determine the Docker network after `supabase start`.',
    );
  }

  throw new Error(
    `Could not determine the Supabase Docker network from running containers: ${runningProjectContainers.join(
      ', ',
    )}`,
  );
}

async function waitForImageWorkerReady(containerName: string): Promise<void> {
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    const status = await captureCommandOutput('docker', [
      'inspect',
      '-f',
      '{{.State.Status}}',
      containerName,
    ]);

    if (status !== 'running') {
      const logs = await captureCombinedCommandOutput('docker', [
        'logs',
        '--tail',
        '40',
        containerName,
      ]);

      throw new Error(
        `Image conversion worker container exited before becoming ready.${
          logs ? `\nRecent output from the worker container:\n${logs}` : ''
        }`,
      );
    }

    const logs = await captureCombinedCommandOutput('docker', [
      'logs',
      '--tail',
      '40',
      containerName,
    ]);

    if (logs.includes(IMAGE_WORKER_READY_MESSAGE)) {
      return;
    }

    await sleep(500);
  }

  const logs = await captureCombinedCommandOutput('docker', [
    'logs',
    '--tail',
    '40',
    containerName,
  ]);

  throw new Error(
    `Timed out waiting for the image conversion worker container to start.${
      logs ? `\nRecent output from the worker container:\n${logs}` : ''
    }`,
  );
}

function createFunctionsEnvFile(workerUrl: string): {
  envFileDirectory: string;
  envFilePath: string;
} {
  const localFunctionEnv = readOptionalEnvFile(LOCAL_FUNCTIONS_ENV_PATH);
  const functionsEnv = {
    ...localFunctionEnv,
    ...(process.env.IMAGE_CONVERTER_SHARED_SECRET?.trim()
      ? {
          IMAGE_CONVERTER_SHARED_SECRET: process.env.IMAGE_CONVERTER_SHARED_SECRET.trim(),
        }
      : {}),
    ...(process.env.WORKER_SHARED_SECRET?.trim()
      ? { WORKER_SHARED_SECRET: process.env.WORKER_SHARED_SECRET.trim() }
      : {}),
    IMAGE_CONVERTER_URL: workerUrl,
  };
  const envFileDirectory = mkdtempSync(join(tmpdir(), `${PROJECT_SLUG}-functions-env-`));
  const envFilePath = join(envFileDirectory, 'functions.env');
  const contents = Object.entries(functionsEnv)
    .map(([key, value]) => `${key}=${formatEnvValue(value)}`)
    .join('\n');

  writeFileSync(envFilePath, contents ? `${contents}\n` : '', 'utf8');

  return { envFileDirectory, envFilePath };
}
