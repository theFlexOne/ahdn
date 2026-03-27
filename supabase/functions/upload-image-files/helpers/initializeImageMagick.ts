import { initializeImageMagick } from '@imagemagick/magick-wasm';
import { MAGICK_WASM_WASM_SPEC } from '../constants.ts';

let imageMagickInitialization: Promise<void> | null = null;

export default function initializeBundledImageMagick(): Promise<void> {
  imageMagickInitialization ??= (async () => {
    const wasmUrl = new URL(import.meta.resolve(MAGICK_WASM_WASM_SPEC));
    const wasmBytes = await Deno.readFile(wasmUrl);
    await initializeImageMagick(wasmBytes);
  })();

  return imageMagickInitialization;
}
