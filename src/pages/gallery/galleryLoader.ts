import { fetchImageDataByTags } from "@/lib/supabaseHelpers";

export default async function galleryLoader() {
  const images = await fetchImageDataByTags(["gallery"]);
  console.log(images);

  return {
    images,
  }
}