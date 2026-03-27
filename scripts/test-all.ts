import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

type CliOptions = {
  integrationOnly: boolean;
  noBootstrap: boolean;
  skipFrontend: boolean;
  skipIntegration: boolean;
};

type FunctionsInspectMode = 'run' | 'wait';

type FunctionsServeOptions = {
  envFilePath?: string;
  inspectMode?: FunctionsInspectMode | null;
  noVerifyJwt?: boolean;
};

type BackgroundProcess = {
  outputChunks: string[];
  settled: Promise<void>;
  subprocess: ReturnType<typeof execa>;
};

type ManagedImageWorker = {
  containerName: string;
  envFilePath: string;
  envFileDirectory: string;
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');
const PROJECT_SLUG = toDockerSafeName(basename(ROOT_DIR));
const ROOT_PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const LOCAL_FUNCTIONS_ENV_PATH = join(ROOT_DIR, 'supabase/functions/.env');
const WORKER_DIR = join(ROOT_DIR, 'workers/image-converter');
const FRONTEND_DIRS = [join(ROOT_DIR, 'src'), join(ROOT_DIR, 'tests')];
const SUPABASE_DENO_CONFIG = join(ROOT_DIR, 'supabase/functions/deno.json');
const SUPABASE_UNIT_GLOB = 'supabase/functions/tests/*.unit.test.ts';
const DEFAULT_SUPABASE_INTEGRATION_GLOB = 'supabase/functions/tests/*.integration.test.ts';
const SUPABASE_INTEGRATION_GLOB =
  process.env.SUPABASE_INTEGRATION_GLOB?.trim() || DEFAULT_SUPABASE_INTEGRATION_GLOB;
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
const VITEST_CONFIG_FILES = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.cts',
  'vitest.config.js',
  'vitest.config.mjs',
  'vitest.config.cjs',
];
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/u;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    integrationOnly: false,
    noBootstrap: false,
    skipFrontend: false,
    skipIntegration: false,
  };

  for (const argument of argv) {
    switch (argument) {
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      case '--no-bootstrap':
        options.noBootstrap = true;
        break;
      case '--integration-only':
        options.integrationOnly = true;
        break;
      case '--skip-frontend':
        options.skipFrontend = true;
        break;
      case '--skip-integration':
        options.skipIntegration = true;
        break;
      default:
        throw new Error(`Unknown option: ${argument}`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`Run all tests across the app.

Usage:
  npm exec tsx scripts/test-all.ts [options]

Options:
  --no-bootstrap      Skip npm install/ci checks for Node packages
  --integration-only  Run only Supabase integration tests and their local setup
  --skip-frontend     Skip frontend test discovery and execution
  --skip-integration  Skip Supabase integration tests and function runtime setup
  -h, --help          Show this help message

Environment:
  EDGE_DEBUG=true     Run "supabase functions serve" with --inspect-mode wait
  EDGE_DEBUG=false    Run "supabase functions serve" with --inspect-mode run
  NO_JWT=true         Add --no-verify-jwt when serving functions
`);
}

function readBooleanEnv(key: string): boolean | null {
  const value = process.env[key]?.trim().toLowerCase();

  if (!value) {
    return null;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${key} must be "true" or "false" when set.`);
}

function getFunctionsInspectMode(): FunctionsInspectMode | null {
  const edgeDebug = readBooleanEnv('EDGE_DEBUG');

  if (edgeDebug === null) {
    return null;
  }

  return edgeDebug ? 'wait' : 'run';
}

function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
}

function formatRelativePath(path: string): string {
  const relativePath = relative(ROOT_DIR, path);
  return relativePath || '.';
}

function toDockerSafeName(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return normalized || 'app';
}

function parseEnvContents(contents: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1).trim();
    }

    if (key && value) {
      entries[key] = value;
    }
  }

  return entries;
}

function readOptionalEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }

  return parseEnvContents(readFileSync(path, 'utf8'));
}

function formatEnvValue(value: string): string {
  return /[\s#"']/u.test(value) ? JSON.stringify(value) : value;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function hasDependency(packageJson: PackageJson, dependencyName: string): boolean {
  return Boolean(
    packageJson.dependencies?.[dependencyName] || packageJson.devDependencies?.[dependencyName],
  );
}

function hasMatchingFile(directory: string, pattern: RegExp): boolean {
  if (!existsSync(directory)) {
    return false;
  }

  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (hasMatchingFile(entryPath, pattern)) {
        return true;
      }

      continue;
    }

    if (pattern.test(entry.name)) {
      return true;
    }
  }

  return false;
}

function hasFrontendTestsConfigured(rootPackageJson: PackageJson): boolean {
  if (rootPackageJson.scripts?.['test:frontend']) {
    return true;
  }

  if (VITEST_CONFIG_FILES.some((filename) => existsSync(join(ROOT_DIR, filename)))) {
    return true;
  }

  return FRONTEND_DIRS.some((directory) => hasMatchingFile(directory, TEST_FILE_PATTERN));
}

function logStep(message: string): void {
  console.log(`\n==> ${message}`);
}

function logSkip(message: string): void {
  console.log(`\n==> Skipping: ${message}`);
}

async function runCommand(
  label: string,
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<void> {
  const cwd = options.cwd ?? ROOT_DIR;
  const displayCommand = [command, ...args].join(' ');

  logStep(`${label} (${formatRelativePath(cwd)})`);
  console.log(displayCommand);

  await execa(command, args, {
    cwd,
    env: options.env,
    stderr: 'inherit',
    stdout: 'inherit',
  });
}

async function captureCommandOutput(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<string> {
  const cwd = options.cwd ?? ROOT_DIR;
  const { stdout } = await execa(command, args, {
    cwd,
    env: options.env,
    stderr: 'pipe',
  });

  return stdout.trim();
}

async function captureCombinedCommandOutput(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<string> {
  const cwd = options.cwd ?? ROOT_DIR;
  const { all } = await execa(command, args, {
    all: true,
    cwd,
    env: options.env,
  });

  return all?.trim() ?? '';
}

async function ensureNodeDependencies(packageDir: string): Promise<void> {
  const packageJsonPath = join(packageDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return;
  }

  if (existsSync(join(packageDir, 'node_modules'))) {
    return;
  }

  const installArgs = existsSync(join(packageDir, 'package-lock.json')) ? ['ci'] : ['install'];

  await runCommand(
    `Installing dependencies in ${formatRelativePath(packageDir)}`,
    'npm',
    installArgs,
    { cwd: packageDir },
  );
}

async function maybeRunFrontendTests(rootPackageJson: PackageJson): Promise<void> {
  const frontendScript = rootPackageJson.scripts?.['test:frontend'];

  if (frontendScript) {
    await runCommand('Running frontend tests', 'npm', ['run', 'test:frontend'], {
      cwd: ROOT_DIR,
    });
    return;
  }

  const hasFrontendTests = hasFrontendTestsConfigured(rootPackageJson);

  if (!hasFrontendTests) {
    logSkip('frontend tests (no test:frontend script or frontend test files found)');
    return;
  }

  if (!hasDependency(rootPackageJson, 'vitest')) {
    throw new Error(
      'Frontend tests appear to be configured, but Vitest is not installed. Add a root test:frontend script or install Vitest.',
    );
  }

  await runCommand(
    'Running frontend tests',
    'npm',
    ['exec', 'vitest', 'run', '--passWithNoTests'],
    { cwd: ROOT_DIR },
  );
}

async function maybeRunE2ETests(rootPackageJson: PackageJson): Promise<void> {
  const e2eScript = rootPackageJson.scripts?.['test:e2e'];

  if (!e2eScript) {
    return;
  }

  await runCommand('Running end-to-end tests', 'npm', ['run', 'test:e2e'], {
    cwd: ROOT_DIR,
  });
}

async function startSupabaseFunctionsServe(
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

async function waitForFunctionsReady(
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

async function promptForDebuggerAttach(backgroundProcess: BackgroundProcess): Promise<void> {
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

async function stopSupabaseFunctionsServe(
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

async function startImageWorker(): Promise<ManagedImageWorker> {
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

async function stopImageWorker(worker: ManagedImageWorker | undefined): Promise<void> {
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

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const functionsInspectMode = getFunctionsInspectMode();
  const noVerifyJwt = readBooleanEnv('NO_JWT') === true;
  const rootPackageJson = readPackageJson(ROOT_PACKAGE_JSON_PATH);

  process.chdir(ROOT_DIR);

  if (!options.noBootstrap) {
    await ensureNodeDependencies(ROOT_DIR);
    if (!options.integrationOnly) {
      await ensureNodeDependencies(WORKER_DIR);
    }
  }

  if (options.integrationOnly) {
    logSkip('worker tests (--integration-only)');
    logSkip('frontend tests (--integration-only)');
    logSkip('Supabase function unit tests (--integration-only)');
  } else {
    await runCommand('Running worker tests', 'npm', ['test'], {
      cwd: WORKER_DIR,
    });

    if (options.skipFrontend) {
      logSkip('frontend tests (--skip-frontend)');
    } else {
      await maybeRunFrontendTests(rootPackageJson);
    }

    await runCommand(
      'Running Supabase function unit tests',
      'deno',
      ['test', '-A', '--config', SUPABASE_DENO_CONFIG, SUPABASE_UNIT_GLOB],
      { cwd: ROOT_DIR },
    );
  }

  let backgroundProcess: BackgroundProcess | undefined;
  let imageWorker: ManagedImageWorker | undefined;

  try {
    if (options.skipIntegration) {
      logSkip('Supabase integration tests (--skip-integration)');
    } else {
      await runCommand('Ensuring local Supabase stack is running', 'supabase', ['start'], {
        cwd: ROOT_DIR,
      });

      imageWorker = await startImageWorker();
      backgroundProcess = await startSupabaseFunctionsServe({
        envFilePath: imageWorker.envFilePath,
        inspectMode: functionsInspectMode,
        noVerifyJwt,
      });
      await waitForFunctionsReady(backgroundProcess, functionsInspectMode);

      if (functionsInspectMode === 'wait') {
        await promptForDebuggerAttach(backgroundProcess);
      }

      await runCommand(
        'Running Supabase function integration tests',
        'deno',
        ['test', '-A', '--config', SUPABASE_DENO_CONFIG, SUPABASE_INTEGRATION_GLOB],
        {
          cwd: ROOT_DIR,
          env: {
            RUN_SUPABASE_FUNCTION_INTEGRATION_TESTS: 'true',
          },
        },
      );

      if (!options.integrationOnly) {
        await maybeRunE2ETests(rootPackageJson);
      }
    }
  } finally {
    await stopSupabaseFunctionsServe(backgroundProcess);
    await stopImageWorker(imageWorker);
  }

  logStep('All requested tests passed');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nTest orchestration failed: ${message}`);
  process.exitCode = 1;
});
