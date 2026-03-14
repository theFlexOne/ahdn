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
        `Expected ${JSON.stringify(expected)} but got ${
          JSON.stringify(actual)
        }`,
    );
  }
};
