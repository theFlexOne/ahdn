import type { MediaMetadata } from "@/types";
import { supabase } from "./supabaseClient";
import { STORAGE_ROOT_URL } from "@/constants";

export async function fetchImageDataByTags(
  tags: string[]
): Promise<MediaMetadata[]> {
  const { data, error } = await supabase
    .from("media_bucket_data")
    .select(`*`)
    .contains("tags", tags)
    .like("mimeType", "image/%");

  if (error) {
    console.error(error);
    return [];
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