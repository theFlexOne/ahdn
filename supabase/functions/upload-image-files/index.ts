import "@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";
import { IMAGE_PRESET_KEYS } from "./constants.ts";
import buildImageSets from "./helpers/buildImageSets.ts";
import uploadImageSet from "./helpers/uploadImageSet.ts";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImageData, ImagePreset, ImageSet } from "./types.ts";

type UploadImageRequest = {
  images?: unknown;
  upsert?: unknown;
};

type ValidationFailure = {
  name: string;
  message: string;
};

let supabase: SupabaseClient;

try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_KEY") ?? "";
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error("Error creating Supabase client:", error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isByte(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 255;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string");
}

function decodeBase64(value: string): Uint8Array | null {
  const normalizedValue = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  if (!normalizedValue) {
    return null;
  }

  const paddedValue = normalizedValue.padEnd(
    Math.ceil(normalizedValue.length / 4) * 4,
    "=",
  );

  try {
    const decoded = atob(paddedValue);

    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function decodeImageBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return Uint8Array.from(value);
  }

  if (Array.isArray(value) && value.every(isByte)) {
    return Uint8Array.from(value);
  }

  if (typeof value === "string") {
    const dataUrlMatch = value.match(/^data:(?:[^;,]+)?;base64,(.+)$/s);

    if (dataUrlMatch) {
      return decodeBase64(dataUrlMatch[1]);
    }

    return decodeBase64(value);
  }

  return null;
}

function createFailure(
  index: number,
  value: unknown,
  message: string,
): ValidationFailure {
  const fallbackName = `image-${index + 1}`;

  if (isRecord(value) && typeof value.name === "string" && value.name.trim()) {
    return {
      name: value.name.trim(),
      message,
    };
  }

  return {
    name: fallbackName,
    message,
  };
}

function normalizeImageInput(
  value: unknown,
  index: number,
): { image?: ImageData; failure?: ValidationFailure } {
  if (!isRecord(value)) {
    return {
      failure: createFailure(
        index,
        value,
        "Each images item must be an object",
      ),
    };
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";

  if (!name) {
    return {
      failure: createFailure(
        index,
        value,
        "Each image must include a non-empty name",
      ),
    };
  }

  if (!isImagePreset(value.preset)) {
    return {
      failure: {
        name,
        message: `preset must be one of: ${IMAGE_PRESET_KEYS.join(", ")}`,
      },
    };
  }

  const data = decodeImageBytes(value.data);

  if (!data) {
    return {
      failure: createFailure(
        index,
        value,
        "Each image data value must be a byte array, base64 string, or data URL",
      ),
    };
  }

  if (value.tags !== undefined && !isStringArray(value.tags)) {
    return {
      failure: createFailure(
        index,
        value,
        "Each image tags value must be an array of strings",
      ),
    };
  }

  if (value.alt !== undefined && typeof value.alt !== "string") {
    return {
      failure: createFailure(
        index,
        value,
        "Each image alt value must be a string",
      ),
    };
  }

  if (value.metadata !== undefined && !isRecord(value.metadata)) {
    return {
      failure: createFailure(
        index,
        value,
        "Each image metadata value must be an object",
      ),
    };
  }

  const tags = isStringArray(value.tags) ? value.tags : [];
  const alt = typeof value.alt === "string" ? value.alt : "";
  const metadata = isRecord(value.metadata) ? value.metadata : {};

  return {
    image: {
      name,
      data,
      preset: value.preset,
      tags,
      alt,
      metadata,
    },
  };
}

function hasGeneratedVariants(imageSet: ImageSet): boolean {
  return Object.values(imageSet.variants).some((variantsBySize) =>
    Object.values(variantsBySize).some(Boolean)
  );
}

Deno.serve(async (req: Request): Promise<Response> => {
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

  if (!supabase) {
    return Response.json(
      { error: "Supabase client is not configured" },
      { status: 500 },
    );
  }

  const payload = body as UploadImageRequest;

  if (!Array.isArray(payload.images) || payload.images.length === 0) {
    return Response.json(
      { error: "images must be a non-empty array" },
      { status: 400 },
    );
  }

  if (payload.upsert !== undefined && typeof payload.upsert !== "boolean") {
    return Response.json(
      { error: "upsert must be a boolean when provided" },
      { status: 400 },
    );
  }

  const failures: ValidationFailure[] = [];
  const images: ImageData[] = [];

  payload.images.forEach((image, index) => {
    const normalized = normalizeImageInput(image, index);

    if (normalized.failure) {
      failures.push(normalized.failure);
      return;
    }

    if (normalized.image) {
      images.push(normalized.image);
    }
  });

  if (failures.length > 0) {
    return Response.json(
      {
        error: failures.length === 1
          ? failures[0].message
          : "One or more images are invalid",
        failures,
      },
      { status: 400 },
    );
  }

  try {
    const imageSets = await buildImageSets(images, { async: true });
    const emptyImageSets = imageSets.filter((imageSet) =>
      !hasGeneratedVariants(imageSet)
    );
    const upsert = payload.upsert === true;

    if (emptyImageSets.length > 0) {
      return Response.json(
        {
          error: "No uploadable variants were generated for one or more images",
          failures: emptyImageSets.map((imageSet) => ({
            name: imageSet.filenameBase,
            message: "No uploadable variants were generated",
          })),
        },
        { status: 400 },
      );
    }

    const results = await uploadImageSet(supabase, imageSets, {
      upsert,
    });

    return Response.json({
      results,
    });
  } catch (error) {
    console.error("Error processing uploaded images:", error);

    return Response.json(
      {
        error: "Failed to process uploaded images",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
});

function isImagePreset(value: unknown): value is ImagePreset {
  return typeof value === "string" &&
    IMAGE_PRESET_KEYS.includes(value as ImagePreset);
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-image-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{
      "upsert": true,
      "images": [
        {
          "name": "hero-banner.png",
          "preset": "hero",
          "data": "<base64-image>",
          "alt": "Band performing on stage",
          "tags": ["home-page", "hero"],
          "metadata": {
            "section": "home"
          }
        }
      ]
    }'

*/
