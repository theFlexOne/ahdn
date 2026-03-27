import parseFormData from '../upload-video-files/helpers/parseFormData.ts';
import parseRequestOptions from '../upload-video-files/helpers/parseRequestOptions.ts';
import { assert, assertEquals } from './helpers/testUtils.ts';

Deno.test('video parseFormData groups indexed video fields', () => {
  const formData = new FormData();
  formData.append('file[0]', new File(['video-1'], 'example-video1.mp4', { type: 'video/mp4' }));
  formData.append('tags[0]', 'hero');
  formData.append('tags[0]', 'homepage');
  formData.append('metadata[0]', JSON.stringify({ section: 'home' }));
  formData.append('file[1]', new File(['video-2'], 'example-video2.webm', { type: 'video/webm' }));
  formData.append('metadata[1]', JSON.stringify({ section: 'about' }));

  const parsed = parseFormData(formData);

  assertEquals(parsed.length, 2);
  assertEquals(parsed[0].file.name, 'example-video1.mp4');
  assertEquals(JSON.stringify(parsed[0].tags), JSON.stringify(['hero', 'homepage']));
  assertEquals(JSON.stringify(parsed[0].metadata), JSON.stringify({ section: 'home' }));
  assertEquals(parsed[1].file.name, 'example-video2.webm');
  assertEquals(JSON.stringify(parsed[1].tags), JSON.stringify([]));
});

Deno.test('video parseFormData throws for invalid metadata JSON', () => {
  const formData = new FormData();
  formData.append('file[0]', new File(['video-1'], 'example-video1.mp4', { type: 'video/mp4' }));
  formData.append('metadata[0]', '{bad-json');

  let message = '';

  try {
    parseFormData(formData);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(message.includes('Field "metadata[0]" is invalid'));
});

Deno.test('video parseRequestOptions reads formats and upsert values', () => {
  const formData = new FormData();
  formData.append('formats', 'webm');
  formData.append('formats', 'webm');
  formData.append('upsert', 'true');

  const options = parseRequestOptions(formData);

  assertEquals(JSON.stringify(options.formats), JSON.stringify(['webm']));
  assertEquals(options.upsert, true);
  assertEquals((options as { sizes?: unknown }).sizes, undefined);
});
