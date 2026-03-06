// import { DUMMY_EVENTS } from "@/dummyData";
import { supabase } from "@/lib/supabaseClient";
// import { fetchImageMetadataByTags } from "@/lib/supabaseHelpers";

// async function homeLoader() {
//   return {
//     events: DUMMY_EVENTS,
//     images: await fetchImageMetadataByTags(["home-page"]),
//   }
// }

export default function homeLoader2() {
  const { data: { publicUrl: primary } } = supabase.storage.from("public_media").getPublicUrl("bg_hero_vid.av1.webm");
  const { data: { publicUrl: secondary } } = supabase.storage.from("public_media").getPublicUrl("bg_hero_vid.h264.mp4");
  const { data: { publicUrl: poster } } = supabase.storage.from("public_media").getPublicUrl("bg_hero_poster.avif");

  return {
    videoUrls: [{ src: primary, type: "video/webm" }, { src: secondary, type: "video/mp4" }],
    posterSrc: poster
  }
}