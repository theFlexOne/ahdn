import { getUpcomingEvents } from '@/features/events/queries';
import { buildSrc, buildSrcSet } from '@/lib/media';
import Schedule from '@/pages/schedule/Schedule';

import type { Route } from './+types/schedule';

export async function clientLoader() {
  const events = await getUpcomingEvents(10);
  return { events };
}

export default function ScheduleRoute({ loaderData }: Route.ComponentProps) {
  const background = {
    src: buildSrc("bg_hero_2-md.jpg"),
    sources: [
      {
        type: "image/jpeg",
        srcSet: buildSrcSet("bg_hero_2", "jpg"),
      },
      {
        type: "image/webp",
        srcSet: buildSrcSet("bg_hero_2", "webp"),
      },
      {
        type: "image/avif",
        srcSet: buildSrcSet("bg_hero_2", "avif"),
      },
    ]
  }

  return <Schedule events={loaderData.events} background={background} />;
}
