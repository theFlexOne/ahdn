import type { SupabaseClient } from '@supabase/supabase-js';
import extractImageDimensions from '../sync-storage-image-metadata/helpers/extractImageDimensions.ts';
import handleStorageImageWebhook from '../sync-storage-image-metadata/handleStorageImageWebhook.ts';
import { assert, assertEquals } from './helpers/testUtils.ts';

type MockState = {
  bucketId: string | null;
  objectPath: string | null;
  schemaName: string | null;
  tableName: string | null;
  updateValues: Record<string, unknown> | null;
  eqColumn: string | null;
  eqValue: string | null;
  downloadCalls: number;
};

function ascii(value: string): number[] {
  return Array.from(value, (char) => char.charCodeAt(0));
}

function be32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function le32(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function createPng(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    0x89,
    ...ascii('PNG'),
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    ...ascii('IHDR'),
    ...be32(width),
    ...be32(height),
  ]);
}

function createGif(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    ...ascii('GIF89a'),
    width & 0xff,
    (width >>> 8) & 0xff,
    height & 0xff,
    (height >>> 8) & 0xff,
  ]);
}

function createJpeg(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    ...new Array(14).fill(0x00),
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >>> 8) & 0xff,
    height & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9,
  ]);
}

function createWebp(width: number, height: number): Uint8Array {
  return Uint8Array.from([
    ...ascii('RIFF'),
    ...le32(22),
    ...ascii('WEBP'),
    ...ascii('VP8X'),
    ...le32(10),
    0x00,
    0x00,
    0x00,
    0x00,
    (width - 1) & 0xff,
    ((width - 1) >>> 8) & 0xff,
    ((width - 1) >>> 16) & 0xff,
    (height - 1) & 0xff,
    ((height - 1) >>> 8) & 0xff,
    ((height - 1) >>> 16) & 0xff,
  ]);
}

function box(type: string, payload: number[]): number[] {
  return [...be32(payload.length + 8), ...ascii(type), ...payload];
}

function createAvif(width: number, height: number): Uint8Array {
  const ispe = box('ispe', [0x00, 0x00, 0x00, 0x00, ...be32(width), ...be32(height)]);
  const ipco = box('ipco', ispe);
  const iprp = box('iprp', ipco);
  const meta = box('meta', [0x00, 0x00, 0x00, 0x00, ...iprp]);
  const ftyp = box('ftyp', [
    ...ascii('avif'),
    0x00,
    0x00,
    0x00,
    0x00,
    ...ascii('avif'),
    ...ascii('mif1'),
  ]);

  return Uint8Array.from([...ftyp, ...meta]);
}

function createMockSupabase(downloadBytes: Uint8Array) {
  const state: MockState = {
    bucketId: null,
    objectPath: null,
    schemaName: null,
    tableName: null,
    updateValues: null,
    eqColumn: null,
    eqValue: null,
    downloadCalls: 0,
  };

  const client = {
    storage: {
      from(bucketId: string) {
        state.bucketId = bucketId;

        return {
          async download(objectPath: string) {
            state.objectPath = objectPath;
            state.downloadCalls += 1;

            return {
              data: new Blob([downloadBytes]),
              error: null,
            };
          },
        };
      },
    },
    schema(schemaName: string) {
      state.schemaName = schemaName;

      return {
        from(tableName: string) {
          state.tableName = tableName;

          return {
            update(values: Record<string, unknown>) {
              state.updateValues = values;

              return {
                async eq(column: string, value: string) {
                  state.eqColumn = column;
                  state.eqValue = value;

                  return { error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    state,
  };
}

Deno.test('extractImageDimensions reads PNG dimensions', () => {
  const dimensions = extractImageDimensions(createPng(2, 3), 'image/png');

  assertEquals(dimensions.width, 2);
  assertEquals(dimensions.height, 3);
});

Deno.test('extractImageDimensions reads GIF dimensions', () => {
  const dimensions = extractImageDimensions(createGif(4, 5), 'image/gif');

  assertEquals(dimensions.width, 4);
  assertEquals(dimensions.height, 5);
});

Deno.test('extractImageDimensions reads JPEG dimensions', () => {
  const dimensions = extractImageDimensions(createJpeg(6, 7), 'image/jpeg');

  assertEquals(dimensions.width, 6);
  assertEquals(dimensions.height, 7);
});

Deno.test('extractImageDimensions reads WebP dimensions', () => {
  const dimensions = extractImageDimensions(createWebp(320, 180), 'image/webp');

  assertEquals(dimensions.width, 320);
  assertEquals(dimensions.height, 180);
});

Deno.test('extractImageDimensions reads AVIF dimensions', () => {
  const dimensions = extractImageDimensions(createAvif(1440, 900), 'image/avif');

  assertEquals(dimensions.width, 1440);
  assertEquals(dimensions.height, 900);
});

Deno.test(
  'handleStorageImageWebhook updates storage.objects user_metadata with image dimensions',
  async () => {
    const { client, state } = createMockSupabase(createPng(640, 360));
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INSERT',
        table: 'objects',
        schema: 'storage',
        record: {
          id: '11111111-1111-1111-1111-111111111111',
          bucket_id: 'public_media',
          name: 'images/example-image-640.jpg',
          metadata: { mimetype: 'image/png' },
          user_metadata: { alt: 'Hero image', tags: ['hero'] },
        },
        old_record: null,
      }),
    });

    const response = await handleStorageImageWebhook(request, client);
    const body = await response.json();

    assertEquals(response.status, 200);
    assertEquals(state.bucketId, 'public_media');
    assertEquals(state.objectPath, 'images/example-image-640.jpg');
    assertEquals(state.schemaName, 'storage');
    assertEquals(state.tableName, 'objects');
    assertEquals(state.eqColumn, 'id');
    assertEquals(state.eqValue, '11111111-1111-1111-1111-111111111111');
    assertEquals(
      JSON.stringify(state.updateValues),
      JSON.stringify({
        user_metadata: {
          alt: 'Hero image',
          tags: ['hero'],
          width: 640,
          height: 360,
        },
      }),
    );
    assertEquals(body.updated, true);
    assertEquals(body.width, 640);
    assertEquals(body.height, 360);
  },
);

Deno.test('handleStorageImageWebhook skips rows that already have width and height', async () => {
  const { client, state } = createMockSupabase(createPng(1, 1));
  const request = new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'UPDATE',
      table: 'objects',
      schema: 'storage',
      record: {
        id: '22222222-2222-2222-2222-222222222222',
        bucket_id: 'public_media',
        name: 'images/example-image-640.jpg',
        metadata: { mimetype: 'image/png' },
        user_metadata: { width: 640, height: 360, alt: 'Hero image' },
      },
      old_record: null,
    }),
  });

  const response = await handleStorageImageWebhook(request, client);
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.skipped, true);
  assertEquals(state.downloadCalls, 0);
  assertEquals(state.updateValues, null);
  assert(body.reason.includes('already exist'));
});
