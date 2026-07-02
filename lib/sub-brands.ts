import type { SubBrand } from "@/components/sections/SubBrandCarousel";

export const subBrands: SubBrand[] = [
  {
    name: "JIESTAR",
    description: "The flagship JIESTAR line for creative building sets, display models, and core product directions.",
    collectionDescription:
      "JIESTAR is the flagship brand collection, bringing together creative building block sets, display models, vehicles, architecture, and core product lines for retail customers and wholesale partners.",
    image: "/images/sub-brands/jiestar-main-brand-logo-web.png",
    width: 560,
    height: 560,
    collectionHandle: "jiestar",
  },
  {
    name: "iBlock",
    description: "Characterful themed sets across city, military, insects, mecha, and playful display builds.",
    collectionDescription:
      "iBlock focuses on characterful themed building block sets, including city scenes, military subjects, insects, mecha, and playful display models with a bold visual identity.",
    image: "/images/sub-brands/iblock-logo.png",
    width: 194,
    height: 192,
    collectionHandle: "iblock",
  },
  {
    name: "Xbert",
    description: "Display-oriented builds covering modular buildings, vehicles, fantasy scenes, and collectibles.",
    collectionDescription:
      "Xbert is a display-oriented sub-brand for modular buildings, vehicles, fantasy-inspired scenes, and collectible models designed for builders who enjoy shelf-ready creative sets.",
    image: "/images/sub-brands/zhuanyue-xbert-logo.png",
    width: 455,
    height: 230,
    collectionHandle: "xbert",
  },
  {
    name: "TKTWO",
    description: "Detailed military vehicles, armored models, and compact display builds for collectors.",
    collectionDescription:
      "TKTWO brings together detailed military vehicle models, armored builds, and compact display-focused sets for builders who prefer tactical subjects and collectible combat models.",
    image: "/images/sub-brands/tktwo-logo.png",
    width: 270,
    height: 270,
    collectionHandle: "tk-two",
  },
  {
    name: "GULY",
    description: "Technic-style cars, motorcycles, mechanical builds, and RC-ready model directions.",
    collectionDescription:
      "GULY focuses on technic-style vehicles, motorcycles, mechanical builds, and RC-ready model directions, supporting builders who enjoy motion, structure, and performance-inspired designs.",
    image: "/images/sub-brands/guly-logo.png",
    width: 380,
    height: 300,
    collectionHandle: "guly",
  },
  {
    name: "ZOIN",
    description: "Creative display sets across architecture, landmarks, art, seasonal, and playful themes.",
    collectionDescription:
      "ZOIN develops creative display building block sets across architecture, landmarks, art, seasonal subjects, and playful themes, with a stronger focus on visual storytelling and giftable models.",
    image: "/images/sub-brands/zoin-logo-high-res-web.png",
    width: 900,
    height: 884,
    collectionHandle: "zoin",
  },
  {
    name: "JIQI",
    description: "Fun Big Player sets for imaginative scenes, bold characters, and large display builds.",
    collectionDescription:
      "JIQI, also known as Fun Big Player, covers imaginative building block sets with bold characters, fantasy-inspired scenes, and larger display builds for expressive collectors and fans.",
    image: "/images/sub-brands/jiqi-logo.png",
    width: 512,
    height: 171,
    collectionHandle: "jiqi",
  },
  {
    name: "Small Angle",
    description: "Compact MOC-style vehicles and mechanical subjects for focused, shelf-friendly builds.",
    collectionDescription:
      "Small Angle offers compact MOC-style vehicles, mechanical subjects, and focused display models, making it a strong fit for builders who want smaller sets with recognizable forms and efficient builds.",
    image: "/images/sub-brands/xiaojiaodu-logo.png",
    width: 500,
    height: 280,
    collectionHandle: "small-angle",
    isCollectionEnabled: false,
  },
];

export const subBrandCollectionHandles = new Set(
  subBrands.map((brand) => brand.collectionHandle).filter((handle): handle is string => Boolean(handle)),
);

export function isSubBrandCollectionEnabled(handle: string) {
  const brand = getSubBrandByCollectionHandle(handle);

  return Boolean(brand?.collectionHandle && brand.isCollectionEnabled !== false);
}

export function getEnabledSubBrands() {
  return subBrands.filter((brand) => !brand.collectionHandle || brand.isCollectionEnabled !== false);
}

export function getEnabledSubBrandCollectionHandles() {
  return subBrands
    .filter((brand) => brand.collectionHandle && brand.isCollectionEnabled !== false)
    .map((brand) => brand.collectionHandle as string);
}

export function isSubBrandCollectionHandle(handle: string) {
  return subBrandCollectionHandles.has(handle);
}

export function getSubBrandByCollectionHandle(handle: string) {
  return subBrands.find((brand) => brand.collectionHandle === handle);
}
