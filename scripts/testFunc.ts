type TestFuncOptions<TArgs extends unknown[]> = {
  args?: TArgs;
  executions?: number;
};

async function testFunc<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => Promise<TResult>,
  options: TestFuncOptions<TArgs> = {},
): Promise<[number, TResult]> {
  const { args, executions = 1 } = options;

  if (!Number.isInteger(executions) || executions < 1) {
    throw new Error("executions must be an integer greater than 0");
  }

  const callArgs = (args ?? []) as unknown as TArgs;
  const runs = await Promise.all(
    Array.from({ length: executions }, async () => {
      const start = performance.now();
      const result = await func(...callArgs);
      const ms = performance.now() - start;
      return { result, ms };
    }),
  );

  const totalMs = runs.reduce((sum, run) => sum + run.ms, 0);
  const result = runs[runs.length - 1]?.result;

  const averageMs = Math.round(totalMs / executions);

  if (result === undefined) {
    throw new Error("test function did not return a result");
  }

  return [averageMs, result];
}

export default testFunc;
