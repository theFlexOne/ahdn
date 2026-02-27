import type { Database } from "./lib/database.types"

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



// These are the types for each db table or view
export type ImageMetadataView = Database["public"]["Views"]["image_metadata"]["Row"]
export type ImageMetadata = {
  id: string
  path: string
  alt: string
  tags: string[]
}