import { DUMMY_EVENTS } from "@/dummyData";

export default async function homeLoader() {
  return {
    events: DUMMY_EVENTS,
  }
}