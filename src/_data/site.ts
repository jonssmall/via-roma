export type SiteData = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  hours: { days: string; time: string }[];
  reservationSlots: string[];
  disclaimer: string;
};

const site: SiteData = {
  name: "Via Roma",
  tagline: "Traditional Roman cooking, served with warmth.",
  description:
    "Via Roma is a demonstration website for a fictional Roman trattoria — handmade pasta, traditional recipes, and a carefully chosen wine list.",
  url: "https://via-roma.example.com",
  address: {
    line1: "123 Via Roma",
    city: "Knoxville",
    state: "TN",
    zip: "37902",
  },
  phone: "(865) 555-0147",
  email: "hello@viaroma.example.com",
  hours: [
    { days: "Monday – Thursday", time: "5:00 PM – 9:30 PM" },
    { days: "Friday – Saturday", time: "5:00 PM – 10:30 PM" },
    { days: "Sunday", time: "4:00 PM – 9:00 PM" },
  ],
  reservationSlots: [
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
  ],
  disclaimer:
    "Via Roma is a fictional restaurant. This site is a web-development portfolio demonstration — no part of it represents a real business, and no order, reservation, or form on this site is functional.",
};

export default site;
