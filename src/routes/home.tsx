import Home from "@/pages/home/Home";
import type { Route } from "./+types/home";
import { getEvents } from "@/lib/supabase/helpers";

export async function clientLoader(): Promise<{
  events: Awaited<ReturnType<typeof getEvents>>;
}> {
  const events = await getEvents({ limit: 5 });

  console.log('events', events);

  return {
    events,
  };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home events={loaderData.events} />;
}