import PageHeading from "@/components/PageHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Page from "@/layout/Page";
import type { Event } from "@/types";
import { useLoaderData } from "react-router";

export default function Schedule() {
  const { events } = useLoaderData();
  return (
    <Page>
      <PageHeading>Scheduled Events</PageHeading>
      <div className="w-full border-t border-gray-700 flex">
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          <p className="font-semibold text-center">Don't miss a show! Sign up for updates:</p>
          <div className="flex gap-2">
            <Input placeholder="Email" className="border-gray-400 rounded-sm" />
            <Button className="rounded-sm">Sign Up</Button>
          </div>
        </div>
      </div>
      <div className="w-full px-4 self-center">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DATE</TableHead>
              <TableHead>EVENT</TableHead>
              <TableHead>LOCATION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event: Event) => (
              <TableRow>
                <TableCell>
                  <span className="font-semibold">{formatDisplayDate(event.date)}</span>
                  {" @ "}
                  {formatDisplayTime(event.date)}
                </TableCell>
                <TableCell className="whitespace-normal">{event.title}</TableCell>
                <TableCell>
                  <p>{event.venue}</p>
                  <p>{event.address.street}</p>
                  <p>{event.address.city}, {event.address.state} {event.address.zip}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Page>
  )
}

function formatDisplayDate(date: Date) {
  const dayNameFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  });
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
  })
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  })
  return `${dayNameFormatter.format(date)}, ${monthFormatter.format(date)} ${dayFormatter.format(date)}`;
}

function formatDisplayTime(date: Date) {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return timeFormatter.format(date);
}