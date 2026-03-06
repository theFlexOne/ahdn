import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadEnv } from "vite";
import mime from "mime-types";

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
  alt: string;
  tags: string[];
  type: string;
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey)

const media = (() => {
  try {
    const media = JSON.parse(fs.readFileSync(MEDIA_JSON_PATH, "utf-8")) as UploadMediaParams[];
    return media;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

async function uploadMediaListToBucket(bucket: string, media: UploadMediaParams[], upsert = false) {
  return await Promise.all(media.map((m) => uploadMediaToBucket(bucket, m, upsert)));
}

async function uploadMediaToBucket(bucket: string, params: UploadMediaParams, upsert: boolean) {
  const { localPath, destPath } = params;

  validateMediaMimeType(localPath);

  try {
    const bytes = await fs.promises.readFile(localPath);

    const file = new File(
      [bytes],
      path.basename(localPath), {
      type: mime.lookup(localPath) as string
    });

    const { error } = await supabase.storage
      .from(bucket)
      .upload(destPath, file, {
        upsert,
        metadata: {
          alt: params.alt,
          tags: params.tags
        }
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error uploading media", error);
    process.exit(1);
  };

  return;
}
function validateMediaMimeType(filePath: string) {
  const type = mime.lookup(filePath);
  if (!type) {
    console.error(`Could not determine mime type for ${filePath}`);
    return;
  }

  if (!type.startsWith("image") && !type.startsWith("video")) {
    console.error(`File ${filePath} is not an image or video`);
    return;
  }
}


async function main() {
  console.log('Uploading image files to S3');
  await uploadMediaListToBucket("public_media", media, true);
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
