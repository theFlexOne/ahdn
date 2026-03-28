import createImageVariants from '../upload-image-files/helpers/createImageVariants.ts';
import parseFormData from '../upload-image-files/helpers/parseFormData.ts';
import parseRequestOptions from '../upload-image-files/helpers/parseRequestOptions.ts';
import { assert, assertEquals } from './helpers/testUtils.ts';

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    Deno.env.delete(key);
    return;
  }

  Deno.env.set(key, value);
}

Deno.test('parseFormData groups indexed image fields', () => {
  const formData = new FormData();
  formData.append('file[0]', new File(['image-1'], 'example-image1.jpg', { type: 'image/jpeg' }));
  formData.append('tags[0]', 'hero');
  formData.append('tags[0]', 'homepage');
  formData.append('alt[0]', 'My image');
  formData.append('metadata[0]', JSON.stringify({ section: 'home' }));
  formData.append('file[1]', new File(['image-2'], 'example-image2.png', { type: 'image/png' }));
  formData.append('metadata[1]', JSON.stringify({ section: 'about' }));

  const parsed = parseFormData(formData);

  assertEquals(parsed.length, 2);
  assertEquals(parsed[0].file.name, 'example-image1.jpg');
  assertEquals(JSON.stringify(parsed[0].tags), JSON.stringify(['hero', 'homepage']));
  assertEquals(parsed[0].alt, 'My image');
  assertEquals(JSON.stringify(parsed[0].metadata), JSON.stringify({ section: 'home' }));
  assertEquals(parsed[1].file.name, 'example-image2.png');
  assertEquals(JSON.stringify(parsed[1].tags), JSON.stringify([]));
  assertEquals(parsed[1].alt, 'example-image2');
});

Deno.test('parseFormData throws for invalid metadata JSON', () => {
  const formData = new FormData();
  formData.append('file[0]', new File(['image-1'], 'example-image1.jpg', { type: 'image/jpeg' }));
  formData.append('metadata[0]', '{bad-json');

  let message = '';

  try {
    parseFormData(formData);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(message.includes('Field "metadata[0]" is invalid'));
});

Deno.test('parseRequestOptions reads preset and upsert values', () => {
  const formData = new FormData();
  formData.append('preset', 'hero');
  formData.append('upsert', 'true');

  const options = parseRequestOptions(formData);

  assertEquals(options.preset, 'hero');
  assertEquals(options.upsert, true);
});

Deno.test('createImageVariants proxies conversion through the worker and remaps metadata', async () => {
    const originalFetch = globalThis.fetch;
    const originalWorkerUrl = Deno.env.get('IMAGE_CONVERTER_URL');
    const originalWorkerSecret = Deno.env.get('WORKER_SHARED_SECRET');
    const fetchCalls: FetchCall[] = [];

    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      fetchCalls.push({ input, init });

      return Promise.resolve(
        Response.json({
          results: [
            {
              filenameBase: 'example-image1',
              variants: [
                {
                  mimeType: 'image/webp',
                  width: 400,
                  height: 225,
                  filename: 'example-image1-400.webp',
                  contentBase64: btoa('webp-variant'),
                },
                {
                  mimeType: 'image/avif',
                  width: 240,
                  height: 135,
                  filename: 'example-image1-240.avif',
                  contentBase64: btoa('avif-variant'),
                },
              ],
            },
          ],
        }),
      );
    }) as typeof fetch;

    setEnv('IMAGE_CONVERTER_URL', 'https://worker.example.test');
    setEnv('WORKER_SHARED_SECRET', 'shared-secret');

    try {
      const results = await createImageVariants([
        {
          file: new File(['image-1'], 'example-image1.jpg', {
            type: 'image/jpeg',
          }),
          tags: ['hero', 'homepage'],
          alt: 'My image',
          metadata: { section: 'home' },
        },
      ]);

      assertEquals(fetchCalls.length, 1);
      assertEquals(String(fetchCalls[0].input), 'https://worker.example.test/convert');
      assertEquals(fetchCalls[0].init?.method, 'POST');
      assertEquals(
        new Headers(fetchCalls[0].init?.headers).get('x-worker-secret'),
        'shared-secret',
      );

      const requestBody = fetchCalls[0].init?.body;
      assert(requestBody instanceof FormData);
      const formData = requestBody as FormData;
      assertEquals(JSON.stringify(formData.getAll('formats')), JSON.stringify(['avif', 'webp', 'jpg']));
      assertEquals(JSON.stringify(formData.getAll('widths')), JSON.stringify(['600', '900', '1440']));
      assertEquals((formData.get('file[0]') as File | null)?.name, 'example-image1.jpg');

      assertEquals(results.length, 1);
      assertEquals(results[0].filenameBase, 'example-image1');
      assertEquals(results[0].variants.length, 2);
      assertEquals(
        JSON.stringify(results[0].variants.map((variant) => variant.width)),
        JSON.stringify([240, 400]),
      );
      assertEquals(
        JSON.stringify(results[0].variants.map((variant) => variant.mimeType)),
        JSON.stringify(['image/avif', 'image/webp']),
      );
      assertEquals(results[0].variants[0].file.name, 'example-image1-240.avif');
      assertEquals(results[0].variants[0].file.type, 'image/avif');
      assertEquals(await results[0].variants[0].file.text(), 'avif-variant');
      assertEquals(
        JSON.stringify(results[0].variants[0].metadata),
        JSON.stringify({
          section: 'home',
          tags: ['hero', 'homepage'],
          alt: 'My image',
          width: 240,
          height: 135,
        }),
      );
    } finally {
      globalThis.fetch = originalFetch;
      setEnv('IMAGE_CONVERTER_URL', originalWorkerUrl);
      setEnv('WORKER_SHARED_SECRET', originalWorkerSecret);
    }
  },
);

Deno.test('createImageVariants surfaces worker validation errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalWorkerUrl = Deno.env.get('IMAGE_CONVERTER_URL');

  globalThis.fetch = ((): Promise<Response> => {
    return Promise.resolve(
      Response.json(
        {
          error: 'File "vector.svg" is an SVG, which is not supported by this worker',
        },
        { status: 400 },
      ),
    );
  }) as typeof fetch;

  setEnv('IMAGE_CONVERTER_URL', 'https://worker.example.test/convert');

  try {
    let message = '';

    try {
      await createImageVariants([
        {
          file: new File(['image-1'], 'example-image1.jpg', {
            type: 'image/jpeg',
          }),
          tags: [],
          alt: 'My image',
          metadata: {},
        },
      ]);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    assertEquals(message, 'File "vector.svg" is an SVG, which is not supported by this worker');
  } finally {
    globalThis.fetch = originalFetch;
    setEnv('IMAGE_CONVERTER_URL', originalWorkerUrl);
  }
});
