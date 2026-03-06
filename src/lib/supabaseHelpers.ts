import { supabase } from "./supabaseClient";
import mime from "mime-types";

import { STORAGE_ROOT_URL } from "@/constants";

import type { MediaMetadata, UploadMediaParams } from "@/types";

export async function fetchMediaMetadata({
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
    throw error;
  }

  return data as MediaMetadata[] ?? [];
}


export async function fetchEvents(startDate = new Date(), endDate?: Date) {
  const { data, error } = await supabase
    .from("events")
    .select(`*`)
    .gte("date", startDate)
    .lte("date", endDate ?? new Date("2100-01-01"));

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function fetchSongs() {
  const { data, error } = await supabase
    .from("songs")
    .select(`*`);

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function uploadMediaListToBucket(files: File[], upsert = false) {
  return await Promise.all(files.map((f) => {
    uploadMediaToBucket(f, upsert)
  }));
}

export async function uploadMediaToBucket(file: File, destPath: string, params: UploadMediaParams, upsert: boolean) {

  validateMediaMimeType(file);

  try {
    const { error } = await supabase.storage
      .from("media")
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
    return;
  };

  return;
}
function validateMediaMimeType(file: File) {
  if (file.type.startsWith("image") || file.type.startsWith("video")) {
    console.error(`File ${file.name} is not an image or video`);
    return;
  }
}
