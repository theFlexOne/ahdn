import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { TagsInput } from './tagsInput/TagsInput';

export type FileItem = {
  file: File;
  metadata: {
    height?: number;
    width?: number;
    alt?: string;
    tags: string[];
  };
};

type FilesUploaderProps = {
  className?: string;
  fileItems: FileItem[];
  onChange: (files: FileItem[]) => void;
};

export default function FilesUploader({ fileItems, onChange, className }: FilesUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onChange([
        ...fileItems,
        ...acceptedFiles.map((file) => ({
          file,
          metadata: {
            tags: [],
            alt: undefined,
          },
        })),
      ]);
    },
    [fileItems, onChange],
  );

  const updateFileItem = useCallback(
    (fileItem: FileItem, updater: (item: FileItem) => FileItem) => {
      onChange(
        fileItems.map((item) => {
          if (item !== fileItem) return item;

          return updater(item);
        }),
      );
    },
    [fileItems, onChange],
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: true });

  function handleTagsChange(fileItem: FileItem, tags: string[]): void {
    updateFileItem(fileItem, (item) => ({
      ...item,
      metadata: {
        ...item.metadata,
        tags,
      },
    }));
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        {...getRootProps()}
        className={cn(
          'grid min-h-40 w-full place-items-center rounded-md border border-dashed',
          'cursor-pointer hover:border-blue-500 hover:text-blue-500',
          className,
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm">Drag and drop some files here, or click to select files</p>
      </div>

      {fileItems.length > 0 && (
        <div>
          <ul className="flex flex-col gap-2">
            {fileItems.map((fileItem) => (
              <li key={`${fileItem.file.name}-${fileItem.file.lastModified}-${fileItem.file.size}`}>
                <div className="flex rounded-sm border border-gray-400 p-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="grid aspect-square place-items-center border border-gray-400/20">
                      <img
                        src={URL.createObjectURL(fileItem.file)}
                        alt={fileItem.file.name}
                        className="h-auto max-h-30 w-auto max-w-30"
                      />
                    </div>
                    <p className="font-[system-ui] text-sm">{fileItem.file.name}</p>
                  </div>
                  <div>
                    <TagsInput
                      tags={fileItem.metadata.tags}
                      onTagsChange={(tags) => handleTagsChange(fileItem, tags)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
