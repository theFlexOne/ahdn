import { Modal } from '@/components/Modal';
import type React from 'react';

export default function UploadImagesModal({
  ...props
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) {
  return (
    <Modal {...props}>
      <p>Modal</p>
    </Modal>
  );
}
