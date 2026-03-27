import type { SupabaseClient } from "@supabase/supabase-js";
import extractImageDimensions from "./helpers/extractImageDimensions.ts";

type JsonRecord = Record<string, unknown>;

type StorageObjectRecord = {
  id: string;
  bucket_id: string;
  name: string;
  metadata: JsonRecord | null;
  user_metadata: JsonRecord | null;
};

type StorageObjectWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: StorageObjectRecord | null;
  old_record: StorageObjectRecord | null;
};

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Webhook payload is missing "${field}"`);
  }

  return value.trim();
}

function readPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number.parseInt(value, 10);
    return parsed > 0 ? parsed : null;
  }

  return null;
}

function parseStorageObjectRecord(
  value: unknown,
  field: "record" | "old_record",
): StorageObjectRecord | null {
  if (value == null) {
    return null;
  }

  if (!isJsonRecord(value)) {
    throw new Error(`Webhook payload "${field}" must be an object or null`);
  }

  return {
    id: readRequiredString(value.id, `${field}.id`),
    bucket_id: readRequiredString(value.bucket_id, `${field}.bucket_id`),
    name: readRequiredString(value.name, `${field}.name`),
    metadata: isJsonRecord(value.metadata) ? value.metadata : null,
    user_metadata: isJsonRecord(value.user_metadata)
      ? value.user_metadata
      : null,
  };
}

function parseWebhookPayload(value: unknown): StorageObjectWebhookPayload {
  if (!isJsonRecord(value)) {
    throw new Error("Webhook body must be a JSON object");
  }

  const type = readRequiredString(value.type, "type");
  const table = readRequiredString(value.table, "table");
  const schema = readRequiredString(value.schema, "schema");

  if (type !== "INSERT" && type !== "UPDATE" && type !== "DELETE") {
    throw new Error(`Unsupported webhook type "${type}"`);
  }

  return {
    type,
    table,
    schema,
    record: parseStorageObjectRecord(value.record, "record"),
    old_record: parseStorageObjectRecord(value.old_record, "old_record"),
  };
}

function getMimeType(record: StorageObjectRecord): string | null {
  const mimeType = record.metadata?.mimetype;
  return typeof mimeType === "string" && mimeType.length > 0
    ? mimeType.toLowerCase()
    : null;
}

function getUserMetadata(record: StorageObjectRecord): JsonRecord {
  return record.user_metadata ?? {};
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function downloadStorageObject(
  supabase: SupabaseClient,
  bucketId: string,
  objectPath: string,
): Promise<Uint8Array> {
  let lastErrorMessage = "Storage download returned no data";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await supabase.storage
      .from(bucketId)
      .download(objectPath);

    if (!error && data) {
      return new Uint8Array(await data.arrayBuffer());
    }

    lastErrorMessage = error?.message ?? lastErrorMessage;

    if (attempt < 3) {
      await sleep(attempt * 150);
    }
  }

  throw new Error(
    `Failed to download storage object "${bucketId}/${objectPath}": ${lastErrorMessage}`,
  );
}

async function updateUserMetadata(
  supabase: SupabaseClient,
  record: StorageObjectRecord,
  width: number,
  height: number,
): Promise<void> {
  const nextUserMetadata = {
    ...getUserMetadata(record),
    width,
    height,
  };

  const { error } = await supabase
    .schema("storage")
    .from("objects")
    .update({ user_metadata: nextUserMetadata })
    .eq("id", record.id);

  if (error) {
    throw new Error(
      `Failed to update storage.objects user_metadata for "${record.id}": ${error.message}`,
    );
  }
}

export default async function handleStorageImageWebhook(
  req: Request,
  supabase: SupabaseClient | null,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "OPTIONS, POST" },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!supabase) {
    return Response.json(
      { error: "Supabase client is not configured" },
      { status: 500 },
    );
  }

  let payload: StorageObjectWebhookPayload;

  try {
    payload = parseWebhookPayload(await req.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 400 });
  }

  if (payload.schema !== "storage" || payload.table !== "objects") {
    return Response.json(
      { error: "Webhook must target storage.objects" },
      { status: 400 },
    );
  }

  if (payload.type === "DELETE" || !payload.record) {
    return Response.json({
      skipped: true,
      reason: "Webhook payload did not include a current storage object record",
    });
  }

  const record = payload.record;
  const mimeType = getMimeType(record);

  if (mimeType && !mimeType.startsWith("image/")) {
    return Response.json({
      skipped: true,
      reason: `Storage object is not an image (${mimeType})`,
      path: record.name,
    });
  }

  const existingUserMetadata = getUserMetadata(record);
  const existingWidth = readPositiveInteger(existingUserMetadata.width);
  const existingHeight = readPositiveInteger(existingUserMetadata.height);

  if (existingWidth && existingHeight) {
    return Response.json({
      skipped: true,
      reason: "Image dimensions already exist in user_metadata",
      id: record.id,
      path: record.name,
      width: existingWidth,
      height: existingHeight,
    });
  }

  try {
    const fileBytes = await downloadStorageObject(
      supabase,
      record.bucket_id,
      record.name,
    );
    const dimensions = extractImageDimensions(fileBytes, mimeType ?? undefined);

    await updateUserMetadata(
      supabase,
      record,
      dimensions.width,
      dimensions.height,
    );

    return Response.json({
      updated: true,
      id: record.id,
      bucketId: record.bucket_id,
      path: record.name,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Unsupported image format") ||
        message.includes("could not be determined")
      ? 200
      : 500;

    if (status === 500) {
      console.error("Failed to sync storage image metadata:", {
        id: record.id,
        bucketId: record.bucket_id,
        path: record.name,
        mimeType,
        message,
      });
    }

    return Response.json(
      status === 200
        ? {
          skipped: true,
          reason: message,
          id: record.id,
          path: record.name,
          mimeType,
        }
        : {
          error: "Failed to sync storage image metadata",
          message,
          id: record.id,
          path: record.name,
        },
      { status },
    );
  }
}
