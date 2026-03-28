import assert from "node:assert/strict";

import sharp from "npm:sharp";

import { handleRequest } from "./worker.ts";

type ConvertResponseBody = {
  results: Array<{
    filenameBase: string;
    variants: Array<{
      contentBase64: string;
      filename: string;
      height: number;
      mimeType: string;
      width: number;
    }>;
  }>;
};

async function createTestImageFile(): Promise<File> {
  const buffer = await sharp({
    create: {
      background: { alpha: 1, b: 220, g: 120, r: 40 },
      channels: 4,
      height: 900,
      width: 1600,
    },
  })
    .png()
    .toBuffer();

  return new File([buffer], "sample.png", { type: "image/png" });
}

Deno.test("GET /health returns ok", async () => {
  const response = await handleRequest(new Request("http://127.0.0.1/health"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

Deno.test("GET /healthz returns ok with service metadata", async () => {
  const response = await handleRequest(new Request("http://127.0.0.1/healthz"));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "image-converter" });
});

Deno.test("POST /convert returns variants for explicit formats and widths", async () => {
  const formData = new FormData();
  formData.append("formats", "avif");
  formData.append("formats", "webp");
  formData.append("formats", "jpg");
  formData.append("widths", "240");
  formData.append("widths", "400");
  formData.append("widths", "640");
  formData.append("file[0]", await createTestImageFile());

  const response = await handleRequest(
    new Request("http://127.0.0.1/convert", {
      body: formData,
      method: "POST",
    }),
  );

  assert.equal(response.status, 200);

  const body = (await response.json()) as ConvertResponseBody;
  assert.equal(body.results.length, 1);
  assert.equal(body.results[0]?.filenameBase, "sample");
  assert.equal(body.results[0]?.variants.length, 9);
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.width),
    [240, 240, 240, 400, 400, 400, 640, 640, 640],
  );
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.mimeType),
    [
      "image/avif",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "image/jpeg",
      "image/webp",
    ],
  );
  assert.ok(
    body.results[0]?.variants.every(
      (variant) =>
        variant.filename.startsWith("sample-") &&
        variant.height > 0 &&
        variant.contentBase64.length > 0,
    ),
  );
});

Deno.test("POST /convert deduplicates widths and limits output formats", async () => {
  const formData = new FormData();
  formData.append("formats", "webp");
  formData.append("formats", ".jpg");
  formData.append("widths", "512");
  formData.append("widths", "400");
  formData.append("widths", "240");
  formData.append("widths", "640");
  formData.append("widths[0]", "400");
  formData.append("file[0]", await createTestImageFile());

  const response = await handleRequest(
    new Request("http://127.0.0.1/convert", {
      body: formData,
      method: "POST",
    }),
  );

  assert.equal(response.status, 200);

  const body = (await response.json()) as ConvertResponseBody;
  assert.equal(body.results.length, 1);
  assert.equal(body.results[0]?.variants.length, 8);
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.width),
    [240, 240, 400, 400, 512, 512, 640, 640],
  );
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.mimeType),
    [
      "image/jpeg",
      "image/webp",
      "image/jpeg",
      "image/webp",
      "image/jpeg",
      "image/webp",
      "image/jpeg",
      "image/webp",
    ],
  );
});
