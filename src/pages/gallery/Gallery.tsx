import { useLoaderData } from 'react-router';

import ImageCarousel from '@/components/ImageCarousel';
import PageHeading from '@/components/PageHeading';
import { Page } from '@/layout';

import type { MediaMetadata } from "@/types";
export default function Gallery() {
  const { images }: { images: MediaMetadata[] } = useLoaderData();

  return (
    <Page className="gap-10">
      <PageHeading>Gallery</PageHeading>
      <ImageCarousel images={images || []} />
    </Page>
  );
}
