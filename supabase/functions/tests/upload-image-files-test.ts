import { IMAGE_PRESET_KEYS } from "../upload-image-files/constants.ts";

type Handler = (req: Request) => Promise<Response> | Response;

const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEquals = (actual: unknown, expected: unknown, message?: string) => {
  if (!Object.is(actual, expected)) {
    throw new Error(
      message ?? `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
    );
  }
};

const originalServe = Deno.serve;
let handler: Handler | null = null;

Deno.serve = ((...args: unknown[]) => {
  const maybeHandler = typeof args[0] === "function" ? args[0] : args[1];
  if (typeof maybeHandler === "function") {
    handler = maybeHandler as Handler;
  }

  return {
    addr: { transport: "tcp", hostname: "127.0.0.1", port: 0 } as Deno.NetAddr,
    finished: Promise.resolve(),
    ref() {},
    unref() {},
    shutdown: async () => {},
  } as Deno.HttpServer<Deno.NetAddr>;
}) as typeof Deno.serve;

await import("../upload-image-files/index.ts");
Deno.serve = originalServe;

if (!handler) {
  throw new Error("Failed to capture handler from Deno.serve");
}

const call = async (req: Request) => {
  const response = await handler!(req);
  const json = await response.json();
  return { response, json };
};

Deno.test("returns 405 for non-POST methods", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "GET",
    }),
  );

  assertEquals(response.status, 405);
  assertEquals(json.error, "Method not allowed");
});

Deno.test("returns 400 when JSON body is invalid", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(json.error, "Invalid JSON body");
});

Deno.test("returns 400 when images key is missing", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(json.error, "Body must include an images array");
});

Deno.test("returns 400 for invalid preset", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        preset: "invalid",
        images: [],
      }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(
    json.error,
    `preset must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
  );
});

Deno.test("returns 400 when images is not a non-empty array", async () => {
  const nonArray = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: "not-an-array" }),
    }),
  );

  assertEquals(nonArray.response.status, 400);
  assertEquals(nonArray.json.error, "images must be a non-empty array");

  const empty = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: [] }),
    }),
  );

  assertEquals(empty.response.status, 400);
  assertEquals(empty.json.error, "images must be a non-empty array");
});

Deno.test("returns 400 when an image item has invalid type", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: [{}] }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(
    json.error,
    "Each images item must be a byte array, base64 string, or data URL",
  );
});

Deno.test("returns 400 when an image byte array includes invalid values", async () => {
  const { response, json } = await call(
    new Request("http://localhost/functions/v1/upload-image-files", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ images: [[256, -1, 3.14]] }),
    }),
  );

  assertEquals(response.status, 400);
  assertEquals(
    json.error,
    "Each images item must be a byte array, base64 string, or data URL",
  );
  assert(json.error.length > 0);
});
