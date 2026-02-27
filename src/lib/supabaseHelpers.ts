import type { ImageMetadata } from "@/types";
import { supabase } from "./supabaseClient";
import { STORAGE_ROOT_URL } from "@/constants";

export async function fetchImageMetadataByTags(
  tags: string[]
): Promise<ImageMetadata[]> {
  const { data, error } = await supabase
    .from("image_metadata")
    .select(`*`)
    .contains("tags", tags)
    .order("path");

  if (error) {
    console.error(error);
    return [];
  }
  data.forEach((image) => {
    const url = (new URL(`${STORAGE_ROOT_URL}/images${image.path}`)).href;
    image.path = url;
  })
  return data as ImageMetadata[] ?? [];
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