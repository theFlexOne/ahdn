import type { Database } from "./lib/database.types"

type NonNullProps<T, K extends keyof T = keyof T> =
  Omit<T, K> & {
    [P in K]-?: NonNullable<T[P]>;
  };

export type Event = {
  date: Date
  title: string
  description: string
  venue: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export type UploadMediaParams = {
  alt: string;
  tags: string[];
  type: string;
}




// These are the types for each db table or view
type MediaMetadataView = Database["public"]["Views"]["media_bucket_metadata"]["Row"]

export type MediaMetadata = NonNullProps<MediaMetadataView>

export type CreateMediaMetadataParams = NonNullProps<Database["public"]["CompositeTypes"]["media_metadata_input"]>