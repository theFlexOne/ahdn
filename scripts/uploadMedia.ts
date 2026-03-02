import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadEnv } from "vite";

import type { CreateMediaMetadataParams } from "../src/types"

const MEDIA_JSON_PATH = path.join(process.cwd(), "supabase/data/media.json");
// const SUPABASE_STORAGE_ROOT = "https://lzgryhrztslevnuajiqm.supabase.co/storage/v1/object/public";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

// type SupabaseMediaMetadataRow = {
//   id: string;
//   path: string;
//   alt: string | null;
//   media_tags?: {
//     tags?: { id: number; slug: string }[] | null; // <-- array
//   }[] | null;
// };

// type MediaMetadata = {
//   id: string;
//   path: string;
//   alt: string;
//   tags: string[];
// }

type UploadMediaParams = {
  localPath: string;
  destPath: string;
  upsert?: boolean;
  alt?: string;
  tags?: string[];
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey)

const media = (() => {
  try {
    const media = JSON.parse(fs.readFileSync(MEDIA_JSON_PATH, "utf-8")) as UploadMediaParams[];
    media.forEach((m) => {
      m.upsert = true;
      m.alt = path.basename(m.destPath, path.extname(m.destPath));
    })
    return media as UploadMediaParams[];
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

function contentTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}
async function insertMediaMetadata(
  media: UploadMediaParams[],
  uploadData: { id: string; type: string; }[],
  upsert = false
) {

  const createMediaMetadataParams: CreateMediaMetadataParams[] = media.map((m, i) => ({
    id: uploadData[i].id,
    path: m.destPath,
    alt: m.alt ?? "",
    type: uploadData[i].type,
    tag_slugs: m.tags ?? []
  }));

  const { data, error } = await supabase.rpc("create_media_metadata_bulk", {
    p_items: createMediaMetadataParams,
    p_upsert: upsert
  })

  if (error) throw error;
  return data;
}
async function uploadMediaToBucket(bucket: string, media: UploadMediaParams[] | UploadMediaParams) {
  const mediaToUpload = Array.isArray(media) ? media : [media];
  return await Promise.all(mediaToUpload.map((m) => _uploadMediaToBucket(bucket, m)));
}
async function _uploadMediaToBucket(bucket: string, params: UploadMediaParams) {
  const { localPath, destPath, upsert = false } = params;

  const bytes = await fs.promises.readFile(localPath);
  const contentType = contentTypeFromExt(localPath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(destPath, bytes, {
      upsert,
      contentType,
    });

  if (error) throw error;

  return { id: data.id, type: contentType };
}
function deleteMediaFromBucket(bucket: string, mediaPaths: string[]) {
  return supabase.storage.from(bucket).remove(mediaPaths);
}


async function main() {
  console.log('Uploading image files to S3');
  const uploadedMediaData = await uploadMediaToBucket("media", media);

  console.log('Inserting media metadata into DB');
  await insertMediaMetadata(media, uploadedMediaData, true);
}

main().catch(async (err) => {
  console.error(err);
  // try {
  //   await deleteMediaFromBucket("media", media.map((m) => m.destPath));
  // } catch (err) {
  //   console.error(err);
  // }
  process.exit(1);
});
