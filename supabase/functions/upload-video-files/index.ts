import "@supabase/functions-js/edge-runtime.d.ts";
import convertVideoFiles from "./helpers/convertVideoFiles.ts";
import { RequestBody, VideoMetadata } from "./types.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import uploadMediaListToBucket from "../_shared/helpers/uploadMediaListToBucket.ts";

let supabase: SupabaseClient;

try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_KEY") ?? "";
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error("Error creating Supabase client:", error);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("videos" in body)) {
    return Response.json(
      { error: "Body must include a videos array" },
      { status: 400 },
    );
  }

  const videos = body.videos;
  if (!Array.isArray(videos) || videos.length === 0) {
    return Response.json(
      { error: "videos must be a non-empty array" },
      { status: 400 },
    );
  }

  for (const video of videos) {
    if (typeof video.file !== "string") {
      return Response.json(
        {
          error:
            "Each video item must be a byte array, base64 string, or data URL",
        },
        { status: 400 },
      );
    }
  }

  const validVideos = await convertVideoFiles(videos, body.formats, body.sizes);
  const results = await uploadMediaListToBucket<VideoMetadata>(
    supabase,
    validVideos,
    {
      upsert: true,
    },
  );

  return Response.json({
    results,
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-video-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
