import FilesUploader from '@/components/FilesUploader';
import { Modal } from '@/components/Modal';
import type React from 'react';
import { useState } from 'react';

import type { FileItem } from '@/components/FilesUploader';

export default function UploadImagesModal({
  ...props
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) {
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileItem[]>([]);

  return (
    <Modal {...props}>
      <FilesUploader fileItems={filesWithMetadata} onChange={setFilesWithMetadata} />
    </Modal>
  );
}
