import type { VALID_MIME_TYPES } from "./constants";
import type { Database } from "./lib/supabase/database.types";

type NonNullProps<T, K extends keyof T = keyof T> =
  & Omit<T, K>
  & {
    [P in K]-?: NonNullable<T[P]>;
  };

type MediaMetadataView =
  Database["public"]["Views"]["media_bucket_metadata"]["Row"];

export type MediaMetadata = NonNullProps<MediaMetadataView>;

export type CreateMediaMetadata = NonNullProps<
  Database["public"]["CompositeTypes"]["media_metadata_input"]
>;

export type MediaType = "image" | "video";

type ValidImageMimeType = typeof VALID_MIME_TYPES.image[number];

type ImageFileFormatSrcSet = {
  srcList: {
    src: string;
    width: number;
    height: number;
  }[];
  mimetype: ValidImageMimeType;
};

export type ImageBase =
  & Omit<Database["public"]["Views"]["images_mv"]["Row"], "files">
  & {
    files: ImageFileFormatSrcSet[];
  };
