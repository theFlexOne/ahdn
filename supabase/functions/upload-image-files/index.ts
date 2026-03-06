import "@supabase/functions-js/edge-runtime.d.ts";

import type { ImagePreset } from "./types.ts";
import { IMAGE_PRESET_KEYS } from "./constants.ts";
import buildResponsiveImageSetsForPreset from "./helpers/buildResponsiveImageSetForPreset.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("images" in body)) {
    return Response.json(
      { error: "Body must include an images array" },
      { status: 400 },
    );
  }

  const payload = body as { images: unknown; preset?: unknown };
  const preset = payload.preset ?? "content";
  if (!isImagePreset(preset)) {
    return Response.json(
      {
        error: `preset must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const rawImages = payload.images;
  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return Response.json(
      { error: "images must be a non-empty array" },
      { status: 400 },
    );
  }

  const inputs: Uint8Array[] = [];
  for (const raw of rawImages) {
    const decoded = decodeImageInput(raw);
    if (!decoded) {
      return Response.json(
        {
          error:
            "Each images item must be a byte array, base64 string, or data URL",
        },
        { status: 400 },
      );
    }
    inputs.push(decoded);
  }

  try {
    const sets = await buildResponsiveImageSetsForPreset(inputs, preset, {
      async: true,
    });

    return Response.json({
      count: sets.length,
      preset,
      results: sets.map((set) => ({
        avif: summarizeBySize(set.avif),
        webp: summarizeBySize(set.webp),
        jpg: summarizeBySize(set.jpg),
      })),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "Image processing failed",
      },
      { status: 500 },
    );
  }
});

function isImagePreset(value: unknown): value is ImagePreset {
  return typeof value === "string" &&
    IMAGE_PRESET_KEYS.includes(value as ImagePreset);
}

function decodeImageInput(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    if (!value.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      return null;
    }
    return Uint8Array.from(value as number[]);
  }

  if (typeof value === "string") {
    const base64 = value.startsWith("data:")
      ? value.slice(value.indexOf(",") + 1)
      : value;

    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  return null;
}

function summarizeBySize(
  entries: Partial<Record<"small" | "standard" | "large", Uint8Array>>,
) {
  return {
    small: entries.small?.byteLength ?? null,
    standard: entries.standard?.byteLength ?? null,
    large: entries.large?.byteLength ?? null,
  };
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-image-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"preset":"hero","images":["<base64-image-1>","<base64-image-2>"]}'

*/
