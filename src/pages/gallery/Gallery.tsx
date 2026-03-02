import PageHeading from "@/components/PageHeading";
import Page from "@/layout/Page";
import { useLoaderData } from "react-router";

import type { MediaMetadata } from "@/types";
import ImageCarousel from "@/components/ImageCarousel";


export default function Gallery() {
  const { images }: { images: MediaMetadata[] } = useLoaderData();

  return (
    <Page className="gap-10">
      <PageHeading>Gallery</PageHeading>
      <ImageCarousel images={images} />
    </Page>
  );
}
