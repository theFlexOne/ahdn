import "@supabase/functions-js/edge-runtime.d.ts";
import convertVideoFiles from "./helpers/convertVideoFiles.ts";
import parseFormData from "./helpers/parseFormData.ts";
import parseRequestOptions from "./helpers/parseRequestOptions.ts";
import uploadVideos from "./helpers/uploadVideos.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ??
    Deno.env.get("SUPABASE_KEY")?.trim() ?? "";

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error("Error creating Supabase client:", error);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!supabase) {
    return Response.json(
      { error: "Supabase client is not configured" },
      { status: 500 },
    );
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form-data body" }, { status: 400 });
  }

  try {
    const options = parseRequestOptions(formData);
    const parsedVideos = parseFormData(formData);

    if (parsedVideos.length === 0) {
      return Response.json(
        { error: "Body must include at least one video file" },
        { status: 400 },
      );
    }

    const videoVariants = await convertVideoFiles(
      parsedVideos,
      options.formats,
    );
    const results = await uploadVideos(supabase, videoVariants, {
      upsert: options.upsert,
    });

    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Field ") ||
        message.startsWith("Missing video file") ||
        message.startsWith("File ")
      ? 400
      : 500;

    if (status === 500) {
      console.error("Error processing uploaded videos:", error);
    }

    return Response.json(
      {
        error: status === 400 ? message : "Failed to process uploaded videos",
        ...(status === 500 ? { message } : {}),
      },
      { status },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-video-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --form 'formats=mp4' \
    --form 'formats=webm' \
    --form 'upsert=true' \
    --form 'file[0]=@/path/to/hero-video.mp4' \
    --form 'tags[0]=hero' \
    --form 'metadata[0]={"section":"home"}'

*/
