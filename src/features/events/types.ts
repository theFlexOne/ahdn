export type EventDetails = {
  id: number;
  title: string;
  description: string;
  venueName: string;
  address: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  dateTime: Date;
};
