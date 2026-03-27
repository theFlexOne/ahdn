import Image from '@/components/Image';
import PageHeading from '@/components/PageHeading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Page, PageSection } from '@/layout';
import PageCard from '@/layout/PageCard';

import type { EventDetails } from '@/features/events/types';
import type { SrcAndSources } from '@/components/Image';
import { useState } from 'react';
import { Modal } from '@/components/Modal';

export default function Schedule({
  events,
  background,
}: {
  events: EventDetails[];
  background: SrcAndSources;
}) {
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);

  return (
    <Page className="flex-col items-center gap-12 relative">
      <Image className="fixed top-10 left-0 -z-10 brightness-60" {...background} />
      <PageHeading>Scheduled Events</PageHeading>
      <PageCard>
        <PageSection>
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
                {events.map((event: EventDetails) => (
                  <TableRow
                    key={event.id}
                    data-event-id={event.id}
                    className="cursor-pointer hover:bg-gray-200 hover:text-black transition-colors duration-300 ease-in-out"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell>
                      <span className="font-semibold">{formatDisplayDate(event.dateTime)}</span>
                      {' @ '}
                      {formatDisplayTime(event.dateTime)}
                    </TableCell>
                    <TableCell className="whitespace-normal">{event.title}</TableCell>
                    <TableCell>
                      <p>{event.venueName}</p>
                      <p>{`${event.address.address1} ${event.address.address2}`}</p>
                      <p>
                        {event.address.city}, {event.address.state} {event.address.zip}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PageSection>
      </PageCard>
      <Modal
        className="max-w-4xl min-h-80"
        open={selectedEvent !== null}
        closeModal={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="grid flex-1 gap-6 self-stretch md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
            <div className="flex items-center md:min-h-full">
              <p className="max-w-[42ch] text-lg leading-8 md:text-left">
                {selectedEvent?.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 md:border-l md:border-white/10 md:pl-6 self-center">
              <div className="space-y-1">
                <p className="font-semibold">{selectedEvent?.venueName}</p>
                <p>
                  {selectedEvent?.address.address1} {selectedEvent?.address.address2}
                </p>
                <p>
                  {selectedEvent?.address.city}, {selectedEvent?.address.state}{' '}
                  {selectedEvent?.address.zip}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Date</p>
                <p>{selectedEvent ? formatDisplayDate(selectedEvent.dateTime) : null}</p>
                <p>{selectedEvent ? formatDisplayTime(selectedEvent.dateTime) : null}</p>
              </div>
            </div>
          </div>
          {/* <Button onClick={() => setSelectedEvent(null)} className="self-end">
            Close
          </Button> */}
        </div>
      </Modal>
    </Page>
  );
}

function formatDisplayDate(date: Date) {
  const dayNameFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  });
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
  });
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
  });
  return `${dayNameFormatter.format(date)}, ${monthFormatter.format(date)} ${dayFormatter.format(date)}`;
}

function formatDisplayTime(date: Date) {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return timeFormatter.format(date);
}
