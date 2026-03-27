import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import createImageVariants from './helpers/createImageVariants.ts';
import parseFormData from './helpers/parseFormData.ts';
import parseRequestOptions from './helpers/parseRequestOptions.ts';
import uploadImages from './helpers/uploadImages.ts';

let supabase: SupabaseClient | null = null;

try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim() ?? '';
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ?? Deno.env.get('SUPABASE_KEY')?.trim() ?? '';

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!supabase) {
    return Response.json({ error: 'Supabase client is not configured' }, { status: 500 });
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'Invalid form-data body' }, { status: 400 });
  }

  try {
    const options = parseRequestOptions(formData);
    const parsedImages = parseFormData(formData);

    if (parsedImages.length === 0) {
      return Response.json({ error: 'Body must include at least one image file' }, { status: 400 });
    }

    const imageVariants = await createImageVariants(parsedImages, options.preset);
    const results = await uploadImages(supabase, imageVariants, {
      upsert: options.upsert,
    });

    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message.startsWith('Field ') ||
      message.startsWith('Missing image file') ||
      message.startsWith('File ')
        ? 400
        : 500;

    if (status === 500) {
      console.error('Error processing uploaded images:', error);
    }

    return Response.json(
      {
        error: status === 400 ? message : 'Failed to process uploaded images',
        ...(status === 500 ? { message } : {}),
      },
      { status },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upload-image-files' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --form 'preset=hero' \
    --form 'upsert=true' \
    --form 'file[0]=@/path/to/hero-banner.jpg' \
    --form 'tags[0]=home-page' \
    --form 'tags[0]=hero' \
    --form 'alt[0]=Band performing on stage' \
    --form 'metadata[0]={"section":"home"}'

*/
