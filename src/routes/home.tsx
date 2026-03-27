import { getUpcomingEvents } from '@/features/events/queries';
import Home from '@/pages/home/Home';

import type { Route } from './+types/home';
import type { EventDetails } from '@/features/events/types';

// eslint-disable-next-line no-empty-pattern
export async function clientLoader({}: Route.ClientLoaderArgs): Promise<{
  events: Awaited<EventDetails[]>;
}> {
  const events = await getUpcomingEvents();

  return { events };
}

clientLoader.hydrate = true;

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return <Home events={loaderData.events} />;
}
