export type ProductVariant = {
  id: string;
  sku: string;
  title: string;
  price: string;
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: {
    src: string;
    alt: string;
  };
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductSummary = {
  id: string;
  handle: string;
  title: string;
  category: string;
  collectionHandle: string;
  price: string;
  image: string;
  imageAlt: string;
  sku: string;
  pieceCount: string;
  recommendedAge: string;
  images?: ProductImage[];
  series?: string;
  releaseDate?: string;
  createdAt?: string;
};

export type Product = ProductSummary & {
  description: string;
  descriptionHtml?: string;
  sellingPoint: string;
  difficulty: string;
  finishedSize: string;
  packageSize: string;
  material: string;
  shipping: string;
  variantId?: string;
  variants?: ProductVariant[];
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
};

export const siteConfig = {
  name: "JIESTAR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jiestartoys.com",
  businessEmail: "info@jiestartoys.com",
  supportEmail: "support@jiestartoys.com",
  description:
    "JIESTAR is a global building block brand supporting retail customers, wholesale buyers, custom product development, and long-term brand partnerships.",
};

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Custom Solutions", href: "/custom-solutions" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const collections: Collection[] = [
  {
    handle: "technic-vehicles",
    title: "Technic Vehicles",
    description:
      "Mechanical building block sets for builders who love motion, structure, and engineering design.",
    image: "/images/categories/category-technic.png",
  },
  {
    handle: "super-cars",
    title: "Super Cars",
    description:
      "Display-ready car models with bold silhouettes, detailed interiors, and collector appeal.",
    image: "/images/categories/category-car-model.png",
  },
  {
    handle: "military-models",
    title: "Military Models",
    description:
      "Detailed model kits for builders interested in tactical forms, vehicles, and display scenes.",
    image: "/images/categories/category-military.png",
  },
  {
    handle: "trains",
    title: "Trains",
    description:
      "Classic train sets and display models for collectors, families, and channel partners.",
    image: "/images/categories/category-trains.png",
  },
  {
    handle: "architecture",
    title: "Architecture",
    description:
      "Architectural display models built for desks, shelves, gifting, and long-term collections.",
    image: "/images/categories/category-modular-buildings.png",
  },
  {
    handle: "pirate-ships",
    title: "Pirate Ships",
    description:
      "Adventure-driven building experiences with expressive ships, scenes, and display value.",
    image: "/images/categories/category-pirates.png",
  },
  {
    handle: "book-nooks",
    title: "Book Nooks",
    description:
      "Compact display models that bring atmosphere, story, and lighted shelf scenes to life.",
    image: "/images/categories/category-street-view.png",
  },
  {
    handle: "educational-blocks",
    title: "Educational Blocks",
    description:
      "Accessible building sets designed for learning, gifting, retail programs, and family play.",
    image: "/images/categories/category-brick-alliance.png",
  },
];

export const products: Product[] = [
  {
    id: "mock-velocity-super-car",
    handle: "velocity-super-car",
    title: "Velocity Super Car Building Set",
    category: "Super Cars",
    collectionHandle: "super-cars",
    price: "$89.00",
    image: "/images/categories/category-car-model.png",
    imageAlt: "Display super car model built from building blocks",
    description:
      "A display-focused super car building block set designed for adult builders, collectors, and retail shelves.",
    sellingPoint:
      "A bold collector model with sharp body lines and a satisfying building experience.",
    sku: "JS-SC-001",
    pieceCount: "1,286 pcs",
    recommendedAge: "14+",
    difficulty: "Advanced",
    finishedSize: "48 x 22 x 13 cm",
    packageSize: "54 x 35 x 9 cm",
    material: "ABS plastic",
    shipping: "Calculated at checkout.",
  },
  {
    id: "mock-classic-railway",
    handle: "classic-railway-display",
    title: "Classic Railway Display Set",
    category: "Trains",
    collectionHandle: "trains",
    price: "$76.00",
    image: "/images/categories/category-trains.png",
    imageAlt: "Train model displayed in a station scene",
    description:
      "A train-themed building block set for collectors, family gifting, and railway model fans.",
    sellingPoint:
      "A nostalgic railway build with strong shelf presence and broad gift appeal.",
    sku: "JS-TR-002",
    pieceCount: "968 pcs",
    recommendedAge: "12+",
    difficulty: "Intermediate",
    finishedSize: "42 x 8 x 12 cm",
    packageSize: "48 x 32 x 8 cm",
    material: "ABS plastic",
    shipping: "Calculated at checkout.",
  },
  {
    id: "mock-harbor-pirate-ship",
    handle: "harbor-pirate-ship",
    title: "Harbor Pirate Ship Building Set",
    category: "Pirate Ships",
    collectionHandle: "pirate-ships",
    price: "$112.00",
    image: "/images/categories/category-pirates.png",
    imageAlt: "Pirate ship display scene near the sea",
    description:
      "An adventure model with layered details for builders who enjoy story-rich display pieces.",
    sellingPoint:
      "A dramatic ship build made for display, gifting, and themed product lines.",
    sku: "JS-PS-003",
    pieceCount: "1,642 pcs",
    recommendedAge: "14+",
    difficulty: "Advanced",
    finishedSize: "61 x 18 x 48 cm",
    packageSize: "58 x 38 x 11 cm",
    material: "ABS plastic",
    shipping: "Calculated at checkout.",
  },
  {
    id: "mock-urban-architecture",
    handle: "urban-architecture-studio",
    title: "Urban Architecture Studio",
    category: "Architecture",
    collectionHandle: "architecture",
    price: "$68.00",
    image: "/images/categories/category-modular-buildings.png",
    imageAlt: "Architectural model inspired by modern city buildings",
    description:
      "A clean architectural building block model for home display, office desks, and gift programs.",
    sellingPoint:
      "A refined display model for builders who prefer clean geometry and modern design.",
    sku: "JS-AR-004",
    pieceCount: "812 pcs",
    recommendedAge: "12+",
    difficulty: "Intermediate",
    finishedSize: "28 x 22 x 24 cm",
    packageSize: "42 x 29 x 8 cm",
    material: "ABS plastic",
    shipping: "Calculated at checkout.",
  },
];

export const cooperationTypes = [
  "Wholesale",
  "OEM Customization",
  "ODM Development",
  "Product Co-Development",
  "Sub-Brand Partnership",
  "Not Sure Yet",
];

export function getCollection(handle: string) {
  return collections.find((collection) => collection.handle === handle);
}

export function getProductsByCollection(handle: string) {
  return products.filter((product) => product.collectionHandle === handle);
}

export function getProduct(handle: string) {
  return products.find((product) => product.handle === handle);
}

const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

function parseSpecNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function getDifficultyLevel(pieceCount: string, recommendedAge = "") {
  const count = parseSpecNumber(pieceCount);

  if (!count) {
    return "See product package";
  }

  let levelIndex = count >= 1500 ? 3 : count >= 900 ? 2 : count >= 400 ? 1 : 0;
  const age = parseSpecNumber(recommendedAge);

  if (age >= 16 && count >= 1200) {
    levelIndex = Math.max(levelIndex, 3);
  } else if (age >= 14) {
    levelIndex = Math.max(levelIndex, count >= 900 ? 3 : 2);
  } else if (age >= 10) {
    levelIndex = Math.max(levelIndex, 1);
  } else if (age > 0 && age <= 6) {
    levelIndex = Math.min(levelIndex, 1);
  }

  return difficultyLevels[levelIndex];
}
