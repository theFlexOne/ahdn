import "@supabase/functions-js/edge-runtime.d.ts";

import type { ImagePreset, RequestData } from "./types.ts";
import { IMAGE_PRESET_KEYS } from "./constants.ts";
import buildImageSets from "./helpers/buildResponsiveImageSetForPreset.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const fails: {name: string; message: string}[] = [];

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

  const payload = body as RequestData;

  if (!Array.isArray(payload.images) || payload.images.length === 0) {
    return Response.json(
      { error: "images must be a non-empty array" },
      { status: 400 },
    );
  }

  for (const image of payload.images) {
    if (!isImagePreset(image.preset)) {
      fails.push({
        name: image.name,
        message: `preset must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
      });
      continue;
    }

  }

);

function isImagePreset(value: string): value is ImagePreset {
  return typeof value === "string" &&
    IMAGE_PRESET_KEYS.includes(value as ImagePreset);
}



/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-image-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"preset":"hero","images":["<base64-image-1>","<base64-image-2>"]}'

*/
