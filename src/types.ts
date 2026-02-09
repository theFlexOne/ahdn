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