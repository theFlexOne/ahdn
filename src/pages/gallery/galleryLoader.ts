import { DUMMY_IMAGE_URLS } from "@/dummyData";

export default async function galleryLoader() {
  return {
    images: DUMMY_IMAGE_URLS,
  }
}