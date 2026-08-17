export type MenuItem = {
  /** Stable id for cart line items — kept ASCII so it's safe in data attributes. */
  slug: string;
  name: string;
  description: string;
  price: number;
  dietary?: ("V" | "GF")[];
  featured?: boolean;
  /** Swap for real photography — Unsplash placeholders used during dev. */
  image?: string;
};

export type MenuCategory = {
  slug: string;
  name: string;
  description: string;
  image?: string;
  items: MenuItem[];
};

const menu: MenuCategory[] = [
  {
    slug: "antipasti",
    name: "Antipasti",
    description: "Small plates to start, meant for the table to share.",
    items: [
      {
        slug: "bruschetta-al-pomodoro",
        name: "Bruschetta al Pomodoro",
        description:
          "Grilled rustic bread, San Marzano tomatoes, basil, garlic, extra virgin olive oil.",
        price: 13,
        dietary: ["V"],
      },
      {
        slug: "burrata",
        name: "Burrata",
        description:
          "Creamy burrata, heirloom tomatoes, basil oil, aged balsamic.",
        price: 17,
        dietary: ["V", "GF"],
      },
      {
        slug: "fritto-misto",
        name: "Fritto Misto",
        description:
          "Lightly fried calamari, shrimp, and lemon, served with a light aioli.",
        price: 18,
      },
      {
        slug: "polpette-della-nonna",
        name: "Polpette della Nonna",
        description:
          "Slow-braised veal and pork meatballs in San Marzano tomato sugo.",
        price: 15,
      },
    ],
  },
  {
    slug: "pasta",
    name: "Pasta",
    description: "Made in-house daily.",
    image:
      "https://images.unsplash.com/photo-1755594461640-b800c6bafdfa?q=80&w=1600&auto=format&fit=crop",
    items: [
      {
        slug: "cacio-e-pepe",
        name: "Cacio e Pepe",
        description: "Tonnarelli, Pecorino Romano, cracked black pepper.",
        price: 24,
        dietary: ["V"],
        featured: true,
        image:
          "https://images.unsplash.com/photo-1693342754896-0520a7f2bc59?q=80&w=1200&auto=format&fit=crop",
      },
      {
        slug: "spaghetti-alla-carbonara",
        name: "Spaghetti alla Carbonara",
        description: "Guanciale, egg yolk, Pecorino Romano, black pepper.",
        price: 26,
        featured: true,
        image:
          "https://images.unsplash.com/photo-1755594461640-b800c6bafdfa?q=80&w=1200&auto=format&fit=crop",
      },
      {
        slug: "bucatini-allamatriciana",
        name: "Bucatini all'Amatriciana",
        description:
          "Guanciale, San Marzano tomato, Pecorino Romano, a touch of chili.",
        price: 25,
        featured: true,
        image:
          "https://images.unsplash.com/photo-1760390952355-a6b9cf50a7a2?q=80&w=1200&auto=format&fit=crop",
      },
      {
        slug: "rigatoni-alla-norma",
        name: "Rigatoni alla Norma",
        description: "Roasted eggplant, tomato, ricotta salata, basil.",
        price: 23,
        dietary: ["V"],
      },
      {
        slug: "pappardelle-al-ragu",
        name: "Pappardelle al Ragù",
        description: "Wide ribbons, slow-braised beef and pork ragù.",
        price: 27,
      },
    ],
  },
  {
    slug: "secondi",
    name: "Secondi",
    description: "From the kitchen, meant to be the center of the table.",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1600&auto=format&fit=crop",
    items: [
      {
        slug: "saltimbocca-alla-romana",
        name: "Saltimbocca alla Romana",
        description:
          "Veal cutlet, prosciutto, sage, white wine and butter sauce.",
        price: 34,
        featured: true,
        // Only non-Unsplash photo on the site — Unsplash/Pexels had no
        // accurate match. CC BY-SA 2.0, requires attribution (see
        // imageCredits.ts and footer.njk), unlike every other photo here.
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Saltimbocca_alla_romana_%287123618999%29.jpg/1280px-Saltimbocca_alla_romana_%287123618999%29.jpg",
      },
      {
        slug: "pollo-alla-milanese",
        name: "Pollo alla Milanese",
        description:
          "Breaded chicken cutlet, arugula, cherry tomato, shaved parmesan.",
        price: 28,
      },
      {
        slug: "branzino-al-limone",
        name: "Branzino al Limone",
        description:
          "Whole roasted branzino, lemon, herbs, extra virgin olive oil.",
        price: 36,
        dietary: ["GF"],
        featured: true,
        image:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200&auto=format&fit=crop",
      },
      {
        slug: "bistecca-alla-fiorentina",
        name: "Bistecca alla Fiorentina",
        description: "Grilled T-bone, rosemary, sea salt (for two).",
        price: 82,
        dietary: ["GF"],
      },
    ],
  },
  {
    slug: "contorni",
    name: "Contorni",
    description: "Sides, meant for the table.",
    items: [
      {
        slug: "patate-al-rosmarino",
        name: "Patate al Rosmarino",
        description: "Roasted potatoes, rosemary, garlic.",
        price: 10,
        dietary: ["V", "GF"],
      },
      {
        slug: "verdure-grigliate",
        name: "Verdure Grigliate",
        description: "Seasonal grilled vegetables, olive oil, sea salt.",
        price: 11,
        dietary: ["V", "GF"],
      },
      {
        slug: "insalata-mista",
        name: "Insalata Mista",
        description: "Mixed greens, shaved fennel, red wine vinaigrette.",
        price: 9,
        dietary: ["V", "GF"],
      },
    ],
  },
  {
    slug: "dolci",
    name: "Dolci",
    description: "Made in-house.",
    items: [
      {
        slug: "tiramisu",
        name: "Tiramisù",
        description: "Espresso-soaked ladyfingers, mascarpone, cocoa.",
        price: 12,
        dietary: ["V"],
        featured: true,
        image:
          "https://images.unsplash.com/photo-1712262582493-01aa9ec5c7f8?q=80&w=1200&auto=format&fit=crop",
      },
      {
        slug: "panna-cotta",
        name: "Panna Cotta",
        description: "Vanilla bean, seasonal berry compote.",
        price: 10,
        dietary: ["V", "GF"],
      },
      {
        slug: "cannoli",
        name: "Cannoli",
        description: "Ricotta, candied orange, pistachio, dark chocolate.",
        price: 11,
        dietary: ["V"],
      },
      {
        slug: "affogato",
        name: "Affogato",
        description: "Vanilla gelato, hot espresso, cocoa nibs.",
        price: 9,
        dietary: ["V", "GF"],
      },
    ],
  },
];

export default menu;
