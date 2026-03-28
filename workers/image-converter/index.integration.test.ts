import assert from 'node:assert/strict';
import { type AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';

import sharp from 'sharp';

import { app } from './index.ts';

type ConvertResponseBody = {
  results: Array<{
    filenameBase: string;
    variants: Array<{
      mimeType: string;
      width: number;
      height: number;
      filename: string;
      contentBase64: string;
    }>;
  }>;
};

let baseUrl = '';
let stopServer: (() => Promise<void>) | undefined;

async function createTestImageFile(): Promise<File> {
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

  return new File([buffer], 'sample.png', { type: 'image/png' });
}

before(async () => {
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine the worker test server address'));
        return;
      }

      baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
      stopServer = async () => {
        await new Promise<void>((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) {
              rejectClose(error);
              return;
            }

            resolveClose();
          });
        });
      };

      resolve();
    });
  });
});

after(async () => {
  if (stopServer) {
    await stopServer();
  }
});

test('GET /health returns ok', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('POST /convert returns thumbnail variants for a valid image upload', async () => {
  const formData = new FormData();
  formData.append('preset', 'thumbnail');
  formData.append('file[0]', await createTestImageFile());

  const response = await fetch(`${baseUrl}/convert`, {
    method: 'POST',
    body: formData,
  });

  assert.equal(response.status, 200);

  const body = (await response.json()) as ConvertResponseBody;
  assert.equal(body.results.length, 1);
  assert.equal(body.results[0]?.filenameBase, 'sample');
  assert.equal(body.results[0]?.variants.length, 9);
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.width),
    [240, 240, 240, 400, 400, 400, 640, 640, 640],
  );
  assert.deepEqual(
    body.results[0]?.variants.map((variant) => variant.mimeType),
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
    body.results[0]?.variants.every(
      (variant) =>
        variant.filename.startsWith('sample-') &&
        variant.height > 0 &&
        variant.contentBase64.length > 0,
    ),
  );
});
