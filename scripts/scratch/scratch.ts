import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mime from "mime-types";

type UploadMediaParams = {
  localPath: string;
  destPath: string;
  alt: string;
  tags: string[];
  type: string;
}

const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SECRET;
const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchMediaMetadata({
  tags = [],
  types = [],
}: {
  tags?: string[],
  types?: ("image" | "video")[]
}
): Promise<MediaMetadata[]> {
  const typeOrFIlter = types.map((t) => `mimeType.ilike.${t}%`).join(",");
  const { data, error } = await supabase
    .from("media_bucket_metadata")
    .select(`*`)
    .contains("tags", tags)
    .or(typeOrFIlter);

  if (error) {
    console.log(error);
    return [];
  }

  return data as MediaMetadata[] ?? [];
}

const images = await fetchMediaMetadata({ types: ["image"] });
const videos = await fetchMediaMetadata({ types: ["video"] });
const both = await fetchMediaMetadata({ types: ["image", "video"] });

console.log('images count:', images.length);
console.log('videos count:', videos.length);
console.log('both count:', both.length);
