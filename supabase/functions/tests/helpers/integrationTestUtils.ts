import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const DEFAULT_LOCAL_JWT_SECRET =
  "super-secret-jwt-token-with-at-least-32-characters-long";
const DEFAULT_JWT_ISSUER = "supabase-demo";

export const INTEGRATION_TEST_RUN_FLAG =
  "RUN_SUPABASE_FUNCTION_INTEGRATION_TESTS" as const;
export const DEFAULT_MEDIA_BUCKET = "public_media" as const;

type JwtRole = "anon" | "service_role";

export type MediaBucketMetadataRow = {
  path: string;
  mimeType: string | null;
  alt: string | null;
  tags: string[] | null;
};

let anonClientPromise: Promise<SupabaseClient> | null = null;
let adminClientPromise: Promise<SupabaseClient> | null = null;

export function getSupabaseUrl(): string {
  return Deno.env.get("TEST_SUPABASE_URL") ??
    Deno.env.get("SUPABASE_URL") ??
    DEFAULT_LOCAL_SUPABASE_URL;
}

export function isIntegrationTestEnabled(): boolean {
  try {
    return Deno.env.get(INTEGRATION_TEST_RUN_FLAG) === "true";
  } catch (error) {
    if (error instanceof Deno.errors.NotCapable) {
      return false;
    }

    throw error;
  }
}

function getJwtSecret(): string {
  return Deno.env.get("TEST_SUPABASE_JWT_SECRET") ??
    Deno.env.get("SUPABASE_JWT_SECRET") ??
    Deno.env.get("JWT_SECRET") ??
    DEFAULT_LOCAL_JWT_SECRET;
}

function getTokenEnvVar(role: JwtRole): string {
  return role === "anon"
    ? Deno.env.get("TEST_SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      ""
    : Deno.env.get("TEST_SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      "";
}

function toBase64Url(value: Uint8Array): string {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

async function mintLocalJwt(role: JwtRole): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: DEFAULT_JWT_ISSUER,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const encoder = new TextEncoder();
  const headerSegment = toBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadSegment = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

async function getAccessToken(role: JwtRole): Promise<string> {
  return getTokenEnvVar(role) || await mintLocalJwt(role);
}

async function createClientForRole(role: JwtRole): Promise<SupabaseClient> {
  const accessToken = await getAccessToken(role);

  return createClient(getSupabaseUrl(), accessToken, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function getAnonClient(): Promise<SupabaseClient> {
  anonClientPromise ??= createClientForRole("anon");
  return await anonClientPromise;
}

export async function getAdminClient(): Promise<SupabaseClient> {
  adminClientPromise ??= createClientForRole("service_role");
  return await adminClientPromise;
}

export async function ensureBucketExists(
  bucket = DEFAULT_MEDIA_BUCKET,
): Promise<void> {
  const admin = await getAdminClient();
  const { data, error } = await admin.storage.listBuckets();

  if (error) {
    throw new Error(
      `Unable to list storage buckets. If your local project uses a custom JWT secret, set TEST_SUPABASE_JWT_SECRET or TEST_SUPABASE_SERVICE_ROLE_KEY. ${error.message}`,
    );
  }

  if (data.some((existingBucket) => existingBucket.name === bucket)) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(bucket, {
    public: true,
  });

  if (createError && !createError.message.toLowerCase().includes("exists")) {
    throw new Error(
      `Failed to create storage bucket "${bucket}": ${createError.message}`,
    );
  }
}

export async function invokeFunction(
  functionName: string,
  body: FormData,
): Promise<Response> {
  const accessToken = await getAccessToken("anon");

  try {
    return await fetch(`${getSupabaseUrl()}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to reach ${functionName}. Start the local stack with "supabase start" and serve the functions with "supabase functions serve". ${message}`,
    );
  }
}

export async function readFixtureFile(
  path: string | URL,
  options: { name: string; type: string },
): Promise<File> {
  const bytes = await Deno.readFile(path);
  return new File([bytes], options.name, { type: options.type });
}

export async function fetchMediaMetadataByPaths(
  paths: string[],
): Promise<MediaBucketMetadataRow[]> {
  const admin = await getAdminClient();
  const { data, error } = await admin
    .from("media_bucket_metadata")
    .select("path, mimeType, alt, tags")
    .in("path", paths);

  if (error) {
    throw new Error(`Failed to fetch media metadata: ${error.message}`);
  }

  return (data ?? []) as MediaBucketMetadataRow[];
}

export async function removeStorageObjects(
  paths: string[],
  bucket = DEFAULT_MEDIA_BUCKET,
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const admin = await getAdminClient();
  const { error } = await admin.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`Failed to remove storage objects: ${error.message}`);
  }
}
