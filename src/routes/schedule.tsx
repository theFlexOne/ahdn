import Schedule from "@/pages/schedule/Schedule";
import { DUMMY_EVENTS } from "@/dummyData";

export async function clientLoader() {
  return {
    events: DUMMY_EVENTS,
  };
}

export default function ScheduleRoute() {
  return <Schedule />;
}
