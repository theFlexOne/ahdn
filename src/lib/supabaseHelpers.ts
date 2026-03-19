import supabase from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getSupabaseStorageUrl(): string {
  return buildUrl(SUPABASE_URL, "/storage/v1/object/public");
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

function buildUrl(base: string, ...parts: string[]) {
  const trimmedBase = String(base).replace(/\/+$/, "");

  const safePath = parts
    .filter((part) => part != null && part !== "")
    .flatMap((part) => String(part).split("/"))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return safePath ? `${trimmedBase}/${safePath}` : trimmedBase;
}
