import { fetchImageMetadataByTags } from "@/lib/supabaseHelpers";

export default async function galleryLoader() {
  const images = await fetchImageMetadataByTags(["gallery"]);
  console.log(images);

  return {
    images,
  }
}