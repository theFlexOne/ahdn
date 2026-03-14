import { Prettify } from "@supabase/supabase-js";

export type Expand<T> = T extends (...args: unknown[]) => unknown ? T
  : T extends readonly (infer U)[] ? readonly Expand<U>[]
  : T extends object ? Prettify<
      {
        [K in keyof T]: Expand<T[K]>;
      }
    >
  : T;

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

export type MediaFileVariantsWithMetadata<T> = {
  files: File[];
  metadata: T;
};
