export type SubBrandFocus = {
  title: string;
  description: string;
};

export type SubBrandSeoContent = {
  title: string;
  description: string;
  pageHeading: string;
  overview: [string, string];
  productFocus: SubBrandFocus[];
  selectionGuide: string;
  audience: string;
};

export type SubBrand = {
  name: string;
  description: string;
  collectionDescription: string;
  image: string;
  width: number;
  height: number;
  collectionHandle?: string;
  isCollectionEnabled?: boolean;
  isFlagship?: boolean;
  seo: SubBrandSeoContent;
};

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
    isFlagship: true,
    seo: {
      title: "JIESTAR Building Block Sets & Model Kits | Official Website",
      description:
        "Explore JIESTAR building block sets and model kits across flowers, trains, engines, vehicles, and architecture on the official global website.",
      pageHeading: "JIESTAR Building Block Sets & Model Kits",
      overview: [
        "JIESTAR is the flagship collection on the official global website, bringing together building block sets made for creative building, display, gifting, and product discovery. The range covers decorative flowers, trains, engines, vehicles, architecture, mechanical subjects, and other model directions for builders with varied interests.",
        "This collection is the broadest view of the JIESTAR catalog. Shoppers can compare current sets by subject, model style, piece count, recommended age, and display value, while retailers and distributors can use the same catalog to identify product directions for wholesale discussion and assortment planning.",
      ],
      productFocus: [
        {
          title: "Flowers & Display Decor",
          description: "Botanical arrangements, floral sculptures, and decorative models designed for shelves, desks, and gifting.",
        },
        {
          title: "Trains & Vehicles",
          description: "Railway models, cars, and transport-focused sets spanning classic subjects and modern display builds.",
        },
        {
          title: "Engines & Mechanical Models",
          description: "Engine models and structure-led kits for builders interested in motion, mechanisms, and engineering forms.",
        },
        {
          title: "Architecture & Creative Sets",
          description: "Buildings, scenes, and themed models that expand the collection beyond a single product category.",
        },
      ],
      selectionGuide:
        "Start with the subject that best matches the intended building experience: decorative sets for visual impact, vehicles and trains for recognizable forms, or engines and mechanical kits for more structure-led assembly. Use each product page to confirm the current piece count, recommended age, finished-model information, imagery, price, and checkout availability before choosing.",
      audience:
        "Browse the collection for direct purchase, gift and display ideas, or a wider view of JIESTAR product directions. Business buyers can also contact the JIESTAR team to discuss wholesale catalog selection, mixed-SKU planning, packaging needs, and related custom product cooperation.",
    },
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
    seo: {
      title: "iBlock Building Block Sets & Model Kits | JIESTAR Official",
      description:
        "Explore iBlock sets from JIESTAR, including space teams, city and rescue scenes, military mini models, flowers, and creative display builds.",
      pageHeading: "iBlock Building Block Sets & Model Kits",
      overview: [
        "iBlock brings together characterful building block sets with compact stories, recognizable roles, and varied model directions. The collection includes space exploration teams, emergency and medical scenes, military mini models, flowers, insects, mecha, and other creative builds presented on JIESTAR's official global website.",
        "Many iBlock sets are organized around small teams or coordinated model groups, making the range easy to explore by theme. Builders can compare individual display models, multi-model kits, and scene-based sets, while retail buyers can review how different subjects could fit seasonal assortments, gifts, or broader product selections.",
      ],
      productFocus: [
        {
          title: "Space Teams & Rovers",
          description: "Spacecraft, exploration crews, rovers, and coordinated model groups built around discovery themes.",
        },
        {
          title: "City, Rescue & Medical Scenes",
          description: "Role-based team sets covering fire rescue, medical care, and other recognizable city subjects.",
        },
        {
          title: "Military Mini Models",
          description: "Compact vehicle and frontline model groups for builders who prefer tactical and mechanical subjects.",
        },
        {
          title: "Flowers & Creative Displays",
          description: "Seasonal floral models and playful display builds that add color and variety to the collection.",
        },
      ],
      selectionGuide:
        "Choose an iBlock direction by deciding whether the builder prefers a complete scene, a coordinated team, or an individual display model. Space and rescue sets emphasize roles and storytelling, military mini models favor compact mechanical forms, and floral sets offer a more decorative result. Check each product page for the current specifications and available images.",
      audience:
        "Choose iBlock for themed building experiences, compact displays, or coordinated sets that work well as a collection. Wholesale buyers can use this page to review current iBlock directions before discussing catalog availability, order quantities, packaging requirements, and market-specific assortment planning with JIESTAR.",
    },
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
    seo: {
      title: "Xbert Building Sets & Display Models | JIESTAR Official",
      description:
        "Explore Xbert building sets featuring ships, fantasy scenes, buildings, vehicles, and collectible display models on JIESTAR's official website.",
      pageHeading: "Xbert Building Sets & Display Models",
      overview: [
        "Xbert focuses on imaginative, display-oriented building sets with strong silhouettes and scene-setting detail. The collection spans sailing ships, fantasy locations, architectural models, vehicles, creatures, and collectible objects for builders who enjoy finished models that can hold attention on a shelf.",
        "The range moves between realistic subjects and fantasy-inspired storytelling without being limited to one scale or category. Visitors can explore large scene builds, modular-style structures, transport models, and decorative pieces, then compare current products through imagery, SKU details, piece count, and recommended age information.",
      ],
      productFocus: [
        {
          title: "Ships & Coastal Scenes",
          description: "Sailing vessels, rocky islands, reefs, and maritime settings with strong display presence.",
        },
        {
          title: "Fantasy & Adventure Builds",
          description: "Wizard rooms, mythical creatures, haunted settings, and story-led models for imaginative collections.",
        },
        {
          title: "Buildings & Street Scenes",
          description: "Architectural sets, stations, houses, and modular-style scenes created for detailed shelf displays.",
        },
        {
          title: "Vehicles & Collectible Objects",
          description: "Transport models and sculptural display pieces that broaden the Xbert catalog beyond buildings.",
        },
      ],
      selectionGuide:
        "When comparing Xbert sets, consider the finished model's footprint and the kind of display you want to create. Ships and architecture can anchor a larger shelf, fantasy scenes add narrative detail, and collectible objects work as individual accents. Review each product page for current dimensions when available, piece count, imagery, age guidance, and purchasing information.",
      audience:
        "Xbert is suited to collectors, display builders, and gift shoppers looking for distinctive subjects with visual storytelling. The focused themes also make the catalog easy to compare. Retailers and distributors can review the collection as a starting point for wholesale catalog selection, themed assortments, packaging discussion, and related product-line planning with JIESTAR.",
    },
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
    seo: {
      title: "TKTWO Military Building Block Models | JIESTAR Official",
      description:
        "Browse TKTWO military building block models, including detailed tank and armored vehicle kits for collectors and wholesale buyers on JIESTAR.",
      pageHeading: "TKTWO Military Building Block Models",
      overview: [
        "TKTWO is a focused military model collection built around tanks, armored vehicles, and compact display kits. Each set presents a recognizable vehicle subject in building block form, giving collectors a clear way to explore related models within one consistent product direction on JIESTAR's official global website.",
        "Because the catalog is intentionally concentrated, visitors can compare the available vehicles without sorting through unrelated themes. Product pages provide current imagery, SKU details, piece count, recommended age, and purchasing information for each model, while the collection page keeps the complete TKTWO range together.",
      ],
      productFocus: [
        {
          title: "Tank Model Kits",
          description: "A concentrated selection of tracked military vehicles represented as compact building block display models.",
        },
        {
          title: "Armored Vehicle Details",
          description: "Recognizable hulls, turrets, tracks, and exterior forms designed for model-focused building and display.",
        },
        {
          title: "Coordinated Collector Range",
          description: "Related vehicle subjects that can be compared individually or assembled into a focused collection.",
        },
      ],
      selectionGuide:
        "Compare TKTWO models by vehicle subject, silhouette, scale, and the level of exterior detail shown in the product imagery. Builders planning a coordinated display can select several related vehicles, while first-time buyers can begin with one preferred tank model. Confirm the current piece count, recommended age, SKU, price, and availability on each product page.",
      audience:
        "TKTWO is intended for builders and collectors who prefer a clearly defined military vehicle theme. The concentrated catalog also makes repeat assortment planning straightforward as more models become available. Business buyers can review the current range before contacting JIESTAR about wholesale availability, mixed-model orders, catalog presentation, shipping requirements, or a related product selection for their market.",
    },
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
    seo: {
      title: "GULY Building Blocks & Mechanical Model Kits | JIESTAR",
      description:
        "Discover GULY building blocks and mechanical model kits, including performance cars, RC-ready builds, motorcycles, engines, and aircraft from JIESTAR.",
      pageHeading: "GULY Building Blocks & Mechanical Model Kits",
      overview: [
        "GULY concentrates on mechanical building experiences and performance-inspired display models. The collection includes large-scale cars, RC-ready builds, motorcycles, engines, aircraft, and other structure-led subjects for builders who enjoy visible mechanisms, complex forms, and models with a strong technical character.",
        "Vehicle enthusiasts can compare different body styles, scales, and mechanical directions, while builders looking beyond cars can explore engines, aircraft, and other motion-inspired kits. Current product pages provide imagery, SKU information, piece count, recommended age, and purchase details for each GULY model available through JIESTAR.",
      ],
      productFocus: [
        {
          title: "Performance Car Models",
          description: "Large display cars and detailed body designs shaped around modern performance and motorsport forms.",
        },
        {
          title: "RC-Ready Builds",
          description: "Selected vehicle directions that combine mechanical construction with remote-control-ready model concepts.",
        },
        {
          title: "Motorcycles & Engines",
          description: "Two-wheel models and engine kits that put structure, motion, and mechanical detail at the center.",
        },
        {
          title: "Aircraft & Mechanical Subjects",
          description: "Aircraft and other technical display builds that extend the collection beyond road vehicles.",
        },
      ],
      selectionGuide:
        "Select a GULY model by deciding whether the priority is vehicle styling, mechanical assembly, scale, or a possible RC-ready direction. Large cars make prominent display pieces, motorcycles offer a different structure, and engine or aircraft kits focus attention on mechanical form. Check individual listings for current specifications, included functions, imagery, price, and availability.",
      audience:
        "GULY is suited to car enthusiasts, mechanical model builders, collectors, and gift shoppers looking for substantial display pieces. The collection also supports comparisons across several vehicle and model formats. Wholesale buyers can use this page to review current product directions before discussing catalog supply, model selection, order quantities, packaging, and shipping with JIESTAR.",
    },
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
    seo: {
      title: "ZOIN Creative Display Building Sets | JIESTAR Official",
      description:
        "Explore ZOIN creative display building sets across art, architecture, seasonal gifts, figures, animals, and collectible mini builds from JIESTAR.",
      pageHeading: "ZOIN Creative Display Building Sets",
      overview: [
        "ZOIN develops creative building sets with an emphasis on visual storytelling, decoration, and giftable display. The collection ranges from architecture and classical scenes to art-inspired figures, animals, seasonal symbols, and compact mini builds, giving visitors several ways to explore models beyond traditional vehicles.",
        "Some ZOIN sets are designed as individual statement pieces, while others form smaller collectible groups around food, characters, or cultural themes. Shoppers can compare the current catalog through product imagery, SKU details, piece count, recommended age, and display style before choosing a model that fits their space or occasion.",
      ],
      productFocus: [
        {
          title: "Art & Figure Displays",
          description: "Sculptural figures, studio scenes, and art-led models created as decorative building projects.",
        },
        {
          title: "Architecture & Landmarks",
          description: "Classical structures, landmark-inspired builds, and detailed scenes with strong shelf presence.",
        },
        {
          title: "Seasonal & Giftable Models",
          description: "Symbolic animals, celebratory subjects, and colorful display sets suited to gifting and decoration.",
        },
        {
          title: "Collectible Mini Builds",
          description: "Compact food, character, and playful subjects that can be collected individually or as a series.",
        },
      ],
      selectionGuide:
        "Choose a ZOIN set by thinking about where the finished build will be displayed and whether it is intended as a personal project, collectible, or gift. Architecture creates a larger visual anchor, figures and animals work as sculptural accents, and mini builds support smaller collections. Product pages provide the current imagery, specifications, price, and availability.",
      audience:
        "ZOIN is a strong fit for display builders, art and architecture fans, gift shoppers, and collectors who prefer expressive smaller subjects. Business buyers can contact JIESTAR to discuss wholesale catalog availability, themed assortments, order quantities, packaging needs, and related creative product planning.",
    },
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
    seo: {
      title: "JIQI Building Block Display Models | JIESTAR Official",
      description:
        "Discover JIQI building block display models, including mechanical animals, cameras, space scenes, mecha, and wall-art sets on JIESTAR's website.",
      pageHeading: "JIQI Building Block Display Models",
      overview: [
        "JIQI, also known as Fun Big Player, brings together expressive building block models with bold subjects and a strong display focus. The current range includes mechanical animals, retro cameras, space scenes, mecha, wall art, and other imaginative builds presented through JIESTAR's official global website.",
        "The collection moves between sculptural models and recognizable objects, offering different building experiences without losing its visual character. Visitors can explore detailed animals, technology-inspired displays, and fantasy or space directions, then compare current products using imagery, SKU information, piece count, recommended age, and purchase details.",
      ],
      productFocus: [
        {
          title: "Mechanical Animals",
          description: "Phoenix, horse, snail, and other creature models shaped through mechanical and sculptural details.",
        },
        {
          title: "Retro Camera Models",
          description: "Twin-lens, instant, film, and SLR-inspired camera builds designed as recognizable display objects.",
        },
        {
          title: "Space & Mecha Builds",
          description: "Moon bases, astronauts, starry scenes, and characterful mecha for imaginative shelf displays.",
        },
        {
          title: "Wall Art & Creative Displays",
          description: "Flat-format and decorative builds that offer alternatives to conventional freestanding models.",
        },
      ],
      selectionGuide:
        "Compare JIQI models by display format and subject. Mechanical animals offer sculptural detail, cameras recreate familiar objects, space and mecha sets emphasize imaginative scenes, and wall-art builds use a flatter presentation. Review each product page for current imagery, piece count, recommended age, model information, price, and availability before selecting a set.",
      audience:
        "JIQI is suited to collectors, camera and space enthusiasts, display builders, and gift shoppers looking for unusual model subjects. Its varied formats support mixed displays across several creative directions. Wholesale buyers can review the live collection before contacting JIESTAR about catalog supply, assortment planning, order quantities, packaging requirements, and shipping options.",
    },
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
    seo: {
      title: "Small Angle Building Block Models | JIESTAR Official",
      description:
        "Explore compact Small Angle vehicle and mechanical building block models through JIESTAR when this collection becomes publicly available.",
      pageHeading: "Small Angle Building Block Models",
      overview: [
        "Small Angle is registered in the JIESTAR brand portfolio for compact vehicle, mechanical, and MOC-style model directions. Its public collection is currently disabled, so these details remain internal until an approved storefront assortment is ready for visitors.",
        "When the collection is enabled, the page can present verified products, current specifications, and buying information using the same brand-page structure as the rest of the portfolio.",
      ],
      productFocus: [
        {
          title: "Compact Vehicle Models",
          description: "Shelf-friendly vehicle subjects intended for focused building and display.",
        },
        {
          title: "Mechanical Subjects",
          description: "Small-format models shaped around recognizable technical forms and efficient builds.",
        },
      ],
      selectionGuide:
        "The public selection guide will be completed from verified product data when the Small Angle collection is approved for storefront use.",
      audience:
        "The Small Angle collection remains unavailable to public shoppers and search engines until its product assortment is approved and enabled.",
    },
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
