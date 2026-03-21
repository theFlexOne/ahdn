import { getSupabaseClient } from "./supabaseClient";

export function getSupabaseStorageUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  return buildUrl(supabaseUrl, "/storage/v1/object/public");
}

export async function fetchEvents({
  startDate = new Date(new Date().setHours(0, 0, 0, 0)),
  endDate = new Date("2100-01-01"),
  limit,
}: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  if (endDate < startDate) {
    throw new Error("End date must be after start date");
  }

  const supabase = getSupabaseClient();
  console.log(supabase);

  let query = supabase
    .from("events")
    .select(`
      date,
      title,
      venue,
      description,
      address (
        street,
        city,
        state,
        zip
      )
    `)
    .gte("date", startDate.toISOString())
    .lte("date", endDate.toISOString());

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((event) => ({
    date: new Date(event.date),
    title: event.title ?? "",
    venue: event.venue ?? "",
    description: event.description ?? "",
    address: {
      ...event.address,
      street: event.address?.street ?? "",
      city: event.address?.city ?? "",
      state: event.address?.state ?? "",
      zip: event.address?.zip ?? "",
    },
  }));
}

export async function fetchSongs() {
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
