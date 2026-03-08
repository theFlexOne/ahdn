import type { Database } from "./lib/database.types";

type NonNullProps<T, K extends keyof T = keyof T> =
  & Omit<T, K>
  & {
    [P in K]-?: NonNullable<T[P]>;
  };

export type Event = {
  date: Date;
  title: string;
  description: string;
  venue: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

type MediaMetadataView =
  Database["public"]["Views"]["media_bucket_metadata"]["Row"];

export type MediaMetadata = NonNullProps<MediaMetadataView>;

export type CreateMediaMetadata = NonNullProps<
  Database["public"]["CompositeTypes"]["media_metadata_input"]
>;

export type MediaType = "image" | "video";
