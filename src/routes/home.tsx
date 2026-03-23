import { getUpcomingEvents } from '@/features/events/queries';
import Home from '@/pages/home/Home';

import type { Route } from "./+types/home";
import type { EventDetails } from "@/features/events/types";
export async function clientLoader(): Promise<{
  events: Awaited<EventDetails[]>;
}> {
  const events = await getUpcomingEvents();

  console.log('events', events);

  return { events };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home events={loaderData.events} />;
}