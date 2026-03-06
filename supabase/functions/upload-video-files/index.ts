import "@supabase/functions-js/edge-runtime.d.ts";
import convertVideoFile from "./helpers/convertVideoFile.ts";

type RequestBody = {
  videos: File[];
};

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
    if (typeof video !== "string") {
      return Response.json(
        {
          error:
            "Each video item must be a byte array, base64 string, or data URL",
        },
        { status: 400 },
      );
    }
  }

  const validVideos = [];

  for (const video of videos) {
    try {
      validVideos.push([
        convertVideoFile(video, "mp4", 1280),
        convertVideoFile(video, "mp4", 854),
        convertVideoFile(video, "webm", 1280),
        convertVideoFile(video, "webm", 854),
      ]);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to process video";

      return Response.json({ error: message }, { status: 400 });
    }
  }

  return Response.json({
    count: validVideos.length,
    results: validVideos,
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
