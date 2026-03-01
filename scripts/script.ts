import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadEnv } from "vite";


const SUPABASE_STORAGE_ROOT = "https://lzgryhrztslevnuajiqm.supabase.co/storage/v1/object/public";

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

type SupabaseImageRow = {
  id: string;
  path: string;
  alt: string | null;
  image_tags?: {
    tags?: { id: number; slug: string }[] | null; // <-- array
  }[] | null;
};


type ImageMetadata = {
  id: string;
  path: string;
  alt: string;
  tags: string[];
}

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
    const media = JSON.parse(fs.readFileSync("./media.json", "utf-8")) as UploadMediaParams[];
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

console.log('media', media);


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

async function uploadImageToBucket(bucket: string, params: UploadMediaParams) {
  const { localPath, destPath, upsert = false } = params;

  const bytes = await fs.promises.readFile(localPath);
  const contentType = contentTypeFromExt(localPath);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(destPath, bytes, {
      contentType,
      upsert,
      cacheControl: "31536000", // optional: long cache
    });

  if (error) throw error;
  return data.id;
}

async function insertImageMetadata(metadata: ImageMetadata | ImageMetadata[], upsert = false) {
  const { data, error } = await supabase
    .from("images")
    .upsert(
      metadata,
      { onConflict: "id", ignoreDuplicates: !upsert },
    );

  if (error) throw error;
  return data;
}

async function uploadImages(bucket: string, images: UploadMediaParams[]) {
  return Promise.all(images.map((img) => uploadImageToBucket(bucket, img)));
}

async function main() {
  const imageIds = await uploadImages("images", media);
  const imageMetadata = media.map((m, i) => ({
    id: imageIds[i],
    path: m.destPath,
    alt: m.alt ?? "",
    tags: m.tags ?? []
  }));

  await insertImageMetadata(imageMetadata);
}

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });