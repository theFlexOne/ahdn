import { fetchMediaMetadata } from "@/lib/supabaseHelpers";

export default async function galleryLoader() {
  const images = await fetchMediaMetadata(["gallery"]);
  console.log(images);

  return {
    images,
  }
}