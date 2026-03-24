import { MEDIA_BUCKET } from '@/constants';

const IMAGE_VARIANTS = [
  { suffix: 'sm', width: 768 },
  { suffix: 'md', width: 1280 },
  { suffix: 'lg', width: 1920 },
] as const;

export function getSupabaseStorageUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL');
  }

  return buildUrl(supabaseUrl, '/storage/v1/object/public');
}

export function buildSrc(filePath: string): string {
  return buildUrl(getSupabaseStorageUrl(), MEDIA_BUCKET, filePath);
}

export function buildSrcSet(filenameBase: string, ext: string): string {
  return IMAGE_VARIANTS
    .map(({ suffix, width }) => `${buildSrc(`${filenameBase}-${suffix}.${ext}`)} ${width}w`)
    .join(', ');
}

export function getImageVariantSrcSets(filenameBase: string) {
  return {
    jpg: buildSrcSet(filenameBase, 'jpg'),
    webp: buildSrcSet(filenameBase, 'webp'),
    avif: buildSrcSet(filenameBase, 'avif'),
  };
}

function buildUrl(base: string, ...parts: string[]) {
  const trimmedBase = String(base).replace(/\/+$/, '');

  const safePath = parts
    .filter((part) => part != null && part !== '')
    .flatMap((part) => String(part).split('/'))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return safePath ? `${trimmedBase}/${safePath}` : trimmedBase;
}
