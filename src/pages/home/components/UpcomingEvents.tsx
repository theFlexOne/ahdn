import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import type { EventDetails } from "@/features/events/types";

export default function UpcomingEvents({ events }: { events: EventDetails[] }) {
  return (
    <div>
      <h2 className="text-center font-ahdn text-2xl uppercase">Upcoming Events</h2>
      <Table>
        <TableBody>
          {events.slice(0, 3).map((event) => (
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
    </div>
  )
}

function DateBadge({ date }: { date: Date }) {
  return (
    <div className="text-center leading-none">
      <div className="text-xs tracking-widest">
        {formatMonth(date).toUpperCase()}
      </div>

      <div className="text-3xl font-bold text-red-800">
        {formatDay(date)}
      </div>

      <div className="text-sm">
        {formatTime(date).toLowerCase()}
      </div>
    </div>
  );
}

function formatMonth(dateTime: Date) {
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
  });
  return monthFormatter.format(dateTime);
}

function formatDay(dateTime: Date) {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  });
  return dayFormatter.format(dateTime);
}

function formatTime(dateTime: Date) {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return timeFormatter.format(dateTime);
}