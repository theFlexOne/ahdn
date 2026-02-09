import { DUMMY_EVENTS } from "@/dummyData";

export default async function scheduleLoader() {
  return {
    events: DUMMY_EVENTS,
  }
}