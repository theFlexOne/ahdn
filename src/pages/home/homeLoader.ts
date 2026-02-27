import { DUMMY_EVENTS } from "@/dummyData";
import { fetchImageMetadataByTags } from "@/lib/supabaseHelpers";

export default async function homeLoader() {
  return {
    events: DUMMY_EVENTS,
    images: await fetchImageMetadataByTags(["home-page"]),
  }
}