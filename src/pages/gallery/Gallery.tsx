import { useLoaderData } from 'react-router';

import ImageCarousel from '@/components/ImageCarousel';
import PageHeading from '@/components/PageHeading';
import { Page } from '@/layout';

import type { MediaMetadata } from '@/types';
import Button from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useState } from 'react';
import UploadImagesModal from './UploadImagesModal';
export default function Gallery() {
  const { images }: { images: MediaMetadata[] } = useLoaderData();

  const [open, setOpen] = useState(false);

  return (
    <Page className="gap-10">
      <PageHeading>Gallery</PageHeading>
      <ImageCarousel images={images || []} />
      <Button onClick={() => setOpen(true)}>Upload</Button>
      <UploadImagesModal open={open} closeModal={() => setOpen(false)} />
    </Page>
  );
}
