import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { execa } from "execa";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

type CliOptions = {
  noBootstrap: boolean;
  skipFrontend: boolean;
  skipIntegration: boolean;
};

type BackgroundProcess = {
  outputChunks: string[];
  settled: Promise<void>;
  subprocess: ReturnType<typeof execa>;
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const ROOT_PACKAGE_JSON_PATH = join(ROOT_DIR, "package.json");
const WORKER_DIR = join(ROOT_DIR, "workers/image-converter");
const FRONTEND_DIRS = [join(ROOT_DIR, "src"), join(ROOT_DIR, "tests")];
const SUPABASE_DENO_CONFIG = join(ROOT_DIR, "supabase/functions/deno.json");
const SUPABASE_UNIT_GLOB = "supabase/functions/tests/*.unit.test.ts";
const SUPABASE_INTEGRATION_GLOB = "supabase/functions/tests/*.integration.test.ts";
const FUNCTION_HEALTH_URLS = [
  "http://127.0.0.1:54321/functions/v1/upload-image-files",
  "http://127.0.0.1:54321/functions/v1/upload-video-files",
];
const VITEST_CONFIG_FILES = [
  "vitest.config.ts",
  "vitest.config.mts",
  "vitest.config.cts",
  "vitest.config.js",
  "vitest.config.mjs",
  "vitest.config.cjs",
];
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/u;

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    noBootstrap: false,
    skipFrontend: false,
    skipIntegration: false,
  };

  for (const argument of argv) {
    switch (argument) {
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      case "--no-bootstrap":
        options.noBootstrap = true;
        break;
      case "--skip-frontend":
        options.skipFrontend = true;
        break;
      case "--skip-integration":
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
  --skip-frontend     Skip frontend test discovery and execution
  --skip-integration  Skip Supabase integration tests and function runtime setup
  -h, --help          Show this help message
`);
}

function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, "utf8")) as PackageJson;
}

function formatRelativePath(path: string): string {
  const relativePath = relative(ROOT_DIR, path);
  return relativePath || ".";
}

function hasDependency(packageJson: PackageJson, dependencyName: string): boolean {
  return Boolean(
    packageJson.dependencies?.[dependencyName] ||
      packageJson.devDependencies?.[dependencyName],
  );
}

function hasMatchingFile(directory: string, pattern: RegExp): boolean {
  if (!existsSync(directory)) {
    return false;
  }

  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
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
  if (rootPackageJson.scripts?.["test:frontend"]) {
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
  const displayCommand = [command, ...args].join(" ");

  logStep(`${label} (${formatRelativePath(cwd)})`);
  console.log(displayCommand);

  await execa(command, args, {
    cwd,
    env: options.env,
    stderr: "inherit",
    stdout: "inherit",
  });
}

async function ensureNodeDependencies(packageDir: string): Promise<void> {
  const packageJsonPath = join(packageDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    return;
  }

  if (existsSync(join(packageDir, "node_modules"))) {
    return;
  }

  const installArgs = existsSync(join(packageDir, "package-lock.json"))
    ? ["ci"]
    : ["install"];

  await runCommand(
    `Installing dependencies in ${formatRelativePath(packageDir)}`,
    "npm",
    installArgs,
    { cwd: packageDir },
  );
}

async function maybeRunFrontendTests(rootPackageJson: PackageJson): Promise<void> {
  const frontendScript = rootPackageJson.scripts?.["test:frontend"];

  if (frontendScript) {
    await runCommand("Running frontend tests", "npm", ["run", "test:frontend"], {
      cwd: ROOT_DIR,
    });
    return;
  }

  const hasFrontendTests = hasFrontendTestsConfigured(rootPackageJson);

  if (!hasFrontendTests) {
    logSkip("frontend tests (no test:frontend script or frontend test files found)");
    return;
  }

  if (!hasDependency(rootPackageJson, "vitest")) {
    throw new Error(
      "Frontend tests appear to be configured, but Vitest is not installed. Add a root test:frontend script or install Vitest.",
    );
  }

  await runCommand(
    "Running frontend tests",
    "npm",
    ["exec", "vitest", "run", "--passWithNoTests"],
    { cwd: ROOT_DIR },
  );
}

async function maybeRunE2ETests(rootPackageJson: PackageJson): Promise<void> {
  const e2eScript = rootPackageJson.scripts?.["test:e2e"];

  if (!e2eScript) {
    return;
  }

  await runCommand("Running end-to-end tests", "npm", ["run", "test:e2e"], {
    cwd: ROOT_DIR,
  });
}

async function startSupabaseFunctionsServe(): Promise<BackgroundProcess> {
  logStep("Starting Supabase function runtime");
  console.log("supabase functions serve");

  const outputChunks: string[] = [];
  const subprocess = execa("supabase", ["functions", "serve"], {
    all: true,
    cleanup: true,
    cwd: ROOT_DIR,
    forceKillAfterDelay: 5_000,
  });

  subprocess.all?.setEncoding("utf8");
  subprocess.all?.on("data", (chunk: string | Uint8Array) => {
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
  const tail = outputChunks.join("").trim();

  if (!tail) {
    return "";
  }

  return `\nRecent output from "supabase functions serve":\n${tail}`;
}

async function waitForFunctionsReady(backgroundProcess: BackgroundProcess): Promise<void> {
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    if (backgroundProcess.subprocess.exitCode !== null) {
      throw new Error(
        `Supabase function runtime exited before becoming ready.${getProcessOutputTail(backgroundProcess.outputChunks)}`,
      );
    }

    for (const url of FUNCTION_HEALTH_URLS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1_500);

      try {
        await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        return;
      } catch {
        // Keep polling until the function runtime starts accepting requests.
      } finally {
        clearTimeout(timeout);
      }
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }

  throw new Error(
    `Timed out waiting for Supabase functions to start.${getProcessOutputTail(backgroundProcess.outputChunks)}`,
  );
}

async function stopSupabaseFunctionsServe(
  backgroundProcess: BackgroundProcess | undefined,
): Promise<void> {
  if (!backgroundProcess) {
    return;
  }

  if (backgroundProcess.subprocess.exitCode === null) {
    logStep("Stopping Supabase function runtime");
    backgroundProcess.subprocess.kill("SIGTERM");
  }

  await backgroundProcess.settled;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const rootPackageJson = readPackageJson(ROOT_PACKAGE_JSON_PATH);

  process.chdir(ROOT_DIR);

  if (!options.noBootstrap) {
    await ensureNodeDependencies(ROOT_DIR);
    await ensureNodeDependencies(WORKER_DIR);
  }

  await runCommand("Running worker tests", "npm", ["test"], {
    cwd: WORKER_DIR,
  });

  if (options.skipFrontend) {
    logSkip("frontend tests (--skip-frontend)");
  } else {
    await maybeRunFrontendTests(rootPackageJson);
  }

  await runCommand(
    "Running Supabase function unit tests",
    "deno",
    ["test", "-A", "--config", SUPABASE_DENO_CONFIG, SUPABASE_UNIT_GLOB],
    { cwd: ROOT_DIR },
  );

  let backgroundProcess: BackgroundProcess | undefined;

  try {
    if (options.skipIntegration) {
      logSkip("Supabase integration tests (--skip-integration)");
    } else {
      await runCommand(
        "Ensuring local Supabase stack is running",
        "supabase",
        ["start"],
        { cwd: ROOT_DIR },
      );

      backgroundProcess = await startSupabaseFunctionsServe();
      await waitForFunctionsReady(backgroundProcess);

      await runCommand(
        "Running Supabase function integration tests",
        "deno",
        [
          "test",
          "-A",
          "--config",
          SUPABASE_DENO_CONFIG,
          SUPABASE_INTEGRATION_GLOB,
        ],
        {
          cwd: ROOT_DIR,
          env: {
            RUN_SUPABASE_FUNCTION_INTEGRATION_TESTS: "true",
          },
        },
      );

      await maybeRunE2ETests(rootPackageJson);
    }
  } finally {
    await stopSupabaseFunctionsServe(backgroundProcess);
  }

  logStep("All requested tests passed");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nTest orchestration failed: ${message}`);
  process.exitCode = 1;
});
