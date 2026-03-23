import type { EventDetails } from "@/features/events/types";
import getSupabaseClient from './client';

export function getSupabaseStorageUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  return buildUrl(supabaseUrl, "/storage/v1/object/public");
}

export async function getEvents({
  startDate = new Date(new Date().setHours(0, 0, 0, 0)),
  endDate = new Date("2100-01-01"),
  limit,
}: {
  startDate?: Date;
  endDate?: Date;
  limit: number;
}): Promise<EventDetails[]> {
  if (endDate < startDate) {
    throw new Error("End date must be after start date");
  }

  const supabase = getSupabaseClient();

  let query = supabase
    .from("events")
    .select(`
      id,
      dateTime:date_time,
      title,
      venueName:venue_name,
      description,
      address (
        address1:address_1,
        address2:address_2,
        city,
        state,
        zip
      )
    `)
    .gte("date_time", startDate.toISOString())
    .lte("date_time", endDate.toISOString());

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((event) => ({
    id: event.id ?? "",
    dateTime: new Date(event.dateTime),
    title: event.title ?? "",
    venueName: event.venueName ?? "",
    description: event.description ?? "",
    address: {
      address1: event.address?.address1 ?? "",
      address2: event.address?.address2 ?? "",
      city: event.address?.city ?? "",
      state: event.address?.state ?? "",
      zip: event.address?.zip ?? "",
    },
  }));
}

export async function getSongList() {
  const supabase = getSupabaseClient();
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
