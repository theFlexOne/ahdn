export type UploadMediaParams = {
  localPath: string;
  destPath: string;
  alt: string;
  tags: string[];
  type: string;
};

export type MediaFileWithMetadata<T> = {
  file: File;
  metadata: T;
};
