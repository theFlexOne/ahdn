import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import handleStorageImageWebhook from './handleStorageImageWebhook.ts';

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

Deno.serve((req: Request): Promise<Response> => {
  return handleStorageImageWebhook(req, supabase);
});

/* To invoke locally:

  1. Run `supabase start`
  2. Serve functions: `supabase functions serve sync-storage-image-metadata`
  3. Send a webhook-style request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sync-storage-image-metadata' \
    --header 'Authorization: Bearer <service-role-jwt>' \
    --header 'Content-Type: application/json' \
    --data '{
      "type": "INSERT",
      "table": "objects",
      "schema": "storage",
      "record": {
        "id": "00000000-0000-0000-0000-000000000000",
        "bucket_id": "public_media",
        "name": "images/example-image-640.jpg",
        "metadata": { "mimetype": "image/jpeg" },
        "user_metadata": { "alt": "Example image", "tags": ["hero"] }
      },
      "old_record": null
    }'

*/
