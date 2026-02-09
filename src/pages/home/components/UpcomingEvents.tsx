import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { Event } from "@/types";

export default function UpcomingEvents({ events }: { events: Event[] }) {
  return (
    <div>
      <h2 className="text-center font-beatles text-2xl">Upcoming Events</h2>
      <Table>
        <TableBody>
          {events.slice(0, 3).map((event) => (
            <TableRow>
              <TableCell>
                <DateBadge date={event.date} />
              </TableCell>
              <TableCell className="whitespace-normal max-w-2xs text-lg">{event.title}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">

                  <p className="font-semibold">
                    {event.venue}
                  </p>
                  <p>{event.address.city}, {event.address.state}</p>
                </div>
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
      <div className="text-xs tracking-widest text-gray-200">
        {formatMonth(date).toUpperCase()}
      </div>

      <div className="text-3xl font-bold text-black">
        {formatDay(date)}
      </div>

      <div className="text-sm text-gray-200">
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