import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';

export type FunctionsInspectMode = 'run' | 'wait';

type CommandOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SUPABASE_INTEGRATION_GLOB = 'supabase/functions/tests/*.integration.test.ts';

export const ROOT_DIR = resolve(SCRIPT_DIR, '../..');
export const PROJECT_SLUG = toDockerSafeName(basename(ROOT_DIR));
export const LOCAL_FUNCTIONS_ENV_PATH = join(ROOT_DIR, 'supabase/functions/.env');
export const WORKER_DIR = join(ROOT_DIR, 'workers/image-converter');
export const SUPABASE_DENO_CONFIG = join(ROOT_DIR, 'supabase/functions/deno.json');
export const SUPABASE_INTEGRATION_GLOB =
  process.env.SUPABASE_INTEGRATION_GLOB?.trim() || DEFAULT_SUPABASE_INTEGRATION_GLOB;

export function readBooleanEnv(key: string): boolean | null {
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

export function getFunctionsInspectMode(): FunctionsInspectMode | null {
  const edgeDebug = readBooleanEnv('EDGE_DEBUG');

  if (edgeDebug === null) {
    return null;
  }

  return edgeDebug ? 'wait' : 'run';
}

export function readOptionalEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }

  return parseEnvContents(readFileSync(path, 'utf8'));
}

export function formatEnvValue(value: string): string {
  return /[\s#"']/u.test(value) ? JSON.stringify(value) : value;
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

export function logStep(message: string): void {
  console.log(`\n==> ${message}`);
}

export async function runCommand(
  label: string,
  command: string,
  args: string[],
  options: CommandOptions = {},
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

export async function captureCommandOutput(
  command: string,
  args: string[],
  options: CommandOptions = {},
): Promise<string> {
  const cwd = options.cwd ?? ROOT_DIR;
  const { stdout } = await execa(command, args, {
    cwd,
    env: options.env,
    stderr: 'pipe',
  });

  return stdout.trim();
}

export async function captureCombinedCommandOutput(
  command: string,
  args: string[],
  options: CommandOptions = {},
): Promise<string> {
  const cwd = options.cwd ?? ROOT_DIR;
  const { all } = await execa(command, args, {
    all: true,
    cwd,
    env: options.env,
  });

  return all?.trim() ?? '';
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
