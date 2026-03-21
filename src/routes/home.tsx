import Home from "@/pages/home/Home";
import type { Route } from "./+types/home";
import { fetchEvents } from "@/lib/supabaseHelpers";

export async function clientLoader(): Promise<{
  events: Awaited<ReturnType<typeof fetchEvents>>;
}> {
  const events = await fetchEvents({ limit: 5 });

  console.log('events', events);

  return {
    events,
  };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home events={loaderData.events} />;
}