import { DateBadge } from '@/components/DateBadge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import type { EventDetails } from "@/features/events/types";

const EVENT_COUNT = 5;

export default function UpcomingEvents({ events }: { events: EventDetails[] }) {
  return (
    <Table>
      <TableBody>
        {events.slice(0, EVENT_COUNT).map((event) => (
          <TableRow>
            <TableCell className='pr-4'>
              <DateBadge date={event.dateTime} />
            </TableCell>
            <TableCell className="whitespace-normal max-w-2xs text-xl">{event.title}</TableCell>
            <TableCell className="font-semibold text-lg">
              {event.venueName}
            </TableCell>
            <TableCell className="text-end text-lg">
              {event.address.city}, {event.address.state}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
