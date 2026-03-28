import process from 'node:process';

import {
  ROOT_DIR,
  SUPABASE_DENO_CONFIG,
  SUPABASE_INTEGRATION_GLOB,
  getFunctionsInspectMode,
  logStep,
  readBooleanEnv,
  runCommand,
} from './shared.ts';
import {
  type BackgroundProcess,
  type ManagedImageWorker,
  promptForDebuggerAttach,
  startImageWorker,
  startSupabaseFunctionsServe,
  stopImageWorker,
  stopSupabaseFunctionsServe,
  waitForFunctionsReady,
} from './integration.ts';

async function main(): Promise<void> {
  const functionsInspectMode = getFunctionsInspectMode();
  const noVerifyJwt = readBooleanEnv('NO_JWT') === true;

  process.chdir(ROOT_DIR);

  let backgroundProcess: BackgroundProcess | undefined;
  let imageWorker: ManagedImageWorker | undefined;

  try {
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
  } finally {
    await stopSupabaseFunctionsServe(backgroundProcess);
    await stopImageWorker(imageWorker);
  }

  logStep('Supabase function integration tests passed');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nIntegration test orchestration failed: ${message}`);
  process.exitCode = 1;
});
