import { getEvents } from '@/lib/supabase/helpers';
import type { EventDetails } from './types';

export function getUpcomingEvents(limit: number = 5): Promise<EventDetails[]> {
  return getEvents({ limit });
}
