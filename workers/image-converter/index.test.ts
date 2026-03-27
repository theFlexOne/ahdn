import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';

import sharp from 'sharp';

import {
  createImageVariants,
  parseMultipartFiles,
  parseRequestOptions,
  type UploadedFile,
} from './index.ts';

async function createTestImageFile(): Promise<UploadedFile> {
  const buffer = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 4,
      background: { r: 40, g: 120, b: 220, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return {
    name: 'sample.png',
    type: 'image/png',
    bytes: Uint8Array.from(buffer),
  };
}

function createMulterFile(
  fieldname: string,
  originalname: string,
  mimetype: string,
): Express.Multer.File {
  const buffer = Buffer.from('test');

  return {
    fieldname,
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    destination: '',
    filename: originalname,
    path: '',
    buffer,
    stream: Readable.from(buffer),
  };
}

test('createImageVariants returns sorted variants for a valid image', async () => {
  const results = await createImageVariants([await createTestImageFile()], 'thumbnail');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.filenameBase, 'sample');
  assert.equal(results[0]?.variants.length, 9);
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.width),
    [240, 240, 240, 400, 400, 400, 640, 640, 640],
  );
  assert.deepEqual(
    results[0]?.variants.map((variant) => variant.mimeType),
    [
      'image/avif',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/jpeg',
      'image/webp',
    ],
  );
  assert.ok(
    results[0]?.variants.every(
      (variant) =>
        variant.filename.startsWith('sample-') &&
        variant.height > 0 &&
        variant.contentBase64.length > 0,
    ),
  );
});

test('parseRequestOptions rejects an invalid preset', () => {
  assert.throws(
    () => parseRequestOptions({ preset: 'not-a-preset' }),
    /Field "preset" must be one of: thumbnail, content, hero/,
  );
});

test('parseMultipartFiles sorts bracketed file indices', () => {
  const files = parseMultipartFiles([
    createMulterFile('file[1]', 'second.png', 'image/png'),
    createMulterFile('file[0]', 'first.png', 'image/png'),
  ]);

  assert.deepEqual(
    files.map((file) => file.name),
    ['first.png', 'second.png'],
  );
});

test('createImageVariants rejects SVG files', async () => {
  await assert.rejects(
    createImageVariants([
      {
        name: 'vector.svg',
        type: 'image/svg+xml',
        bytes: Uint8Array.from(Buffer.from('<svg></svg>')),
      },
    ]),
    /is an SVG/,
  );
});
