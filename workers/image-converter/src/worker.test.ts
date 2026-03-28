import assert from "node:assert/strict";

import sharp from "npm:sharp";

import { IMAGE_FORMATS } from "./constants.ts";
import type { UploadedFile } from "./types.ts";
import { createImageVariants, parseMultipartFiles, parseRequestOptions } from "./worker.ts";

async function createTestImageFile(): Promise<UploadedFile> {
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

  return {
    bytes: Uint8Array.from(buffer),
    name: "sample.png",
    type: "image/png",
  };
}

Deno.test("createImageVariants returns sorted variants for a valid image", async () => {
  const results = await createImageVariants([await createTestImageFile()], {
    formats: [...IMAGE_FORMATS],
    widths: [240, 400, 640],
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.filenameBase, "sample");
  assert.equal(results[0]?.variants.length, 9);
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.width),
    [240, 240, 240, 400, 400, 400, 640, 640, 640],
  );
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.mimeType),
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
    results[0]?.variants.every(
      (variant) =>
        variant.filename.startsWith("sample-") &&
        variant.height > 0 &&
        variant.contentBase64.length > 0,
    ),
  );
});

Deno.test("parseRequestOptions requires formats and widths", () => {
  const formData = new FormData();

  assert.throws(
    () => parseRequestOptions(formData),
    /Field "formats" must contain at least one supported format\/extension/,
  );
});

Deno.test("parseRequestOptions reads custom formats and widths", () => {
  const formData = new FormData();
  formData.append("formats", ".webp");
  formData.append("formats", "jpeg");
  formData.append("formats[0]", "image/webp");
  formData.append("widths", "960");
  formData.append("widths", "480");
  formData.append("widths[0]", "960");

  const options = parseRequestOptions(formData);

  assert.deepEqual(
    options.formats.map((format) => format.extension),
    ["webp", "jpg"],
  );
  assert.deepEqual(options.widths, [480, 960]);
});

Deno.test("parseMultipartFiles sorts bracketed file indices", async () => {
  const formData = new FormData();
  formData.append("file[1]", new File(["second"], "second.png", { type: "image/png" }));
  formData.append("file[0]", new File(["first"], "first.png", { type: "image/png" }));

  const files = await parseMultipartFiles(formData);

  assert.deepEqual(
    files.map((file) => file.name),
    ["first.png", "second.png"],
  );
});

Deno.test("createImageVariants rejects SVG files", async () => {
  await assert.rejects(
    createImageVariants(
      [
        {
          bytes: Uint8Array.from(new TextEncoder().encode("<svg></svg>")),
          name: "vector.svg",
          type: "image/svg+xml",
        },
      ],
      {
        formats: [...IMAGE_FORMATS],
        widths: [240, 400, 640],
      },
    ),
    /is an SVG/,
  );
});

Deno.test("createImageVariants deduplicates widths and filters requested formats", async () => {
  const results = await createImageVariants([await createTestImageFile()], {
    formats: IMAGE_FORMATS.filter((format) => format.extension !== "avif"),
    widths: [240, 400, 512, 640, 400],
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.variants.length, 8);
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.width),
    [240, 240, 400, 400, 512, 512, 640, 640],
  );
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.mimeType),
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
