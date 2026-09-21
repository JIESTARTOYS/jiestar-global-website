export type CollectionBuyingContent = {
  updatedAt: string;
  seoTitle: string;
  description: string;
  heading: string;
  intro: string;
  guideTitle: string;
  selection: { title: string; text: string }[];
  wholesaleTitle: string;
  wholesale: string;
  questions: { question: string; answer: string }[];
  links: { label: string; href: string }[];
};

// Editorial copy for selected categories; prices, stock and specifications stay in the live catalog.
const collectionContent: Record<string, CollectionBuyingContent> = {
  "flowers-botanical": {
    updatedAt: "2026-09-21",
    seoTitle: "Flower & Botanical Building Block Sets | JIESTAR",
    description: "Explore flower building block sets, bouquets and potted plant models. Compare display space, piece counts and gift options, or ask about wholesale supply.",
    heading: "Flower & Botanical Building Block Sets",
    intro: "Build a floral display with flower, bouquet and potted plant building sets. Explore botanical models for a desk, shelf or gift, then compare the finished dimensions and recommended age on each product page.",
    guideTitle: "Choosing a flower building set for your space",
    selection: [
      { title: "Bouquet or potted display?", text: "Start with the shape you want to display: a flower arrangement, a compact pot or a garden scene. Check the product images and included parts to see how the finished model stands and whether a container is included." },
      { title: "Plan for height and spread", text: "Flower stems and leaves can extend beyond the base. Compare finished height and width with your shelf or desk space, and choose colours that work with the room or the recipient's preferences." },
      { title: "Match the building experience", text: "Piece count helps compare the size of a project, but it does not set the recommended age. Read the individual age guidance and close-up images, especially when choosing a botanical set as a gift." },
    ],
    wholesaleTitle: "Planning a botanical gift assortment",
    wholesale: "For a shop or gift range, shortlist flower and potted plant SKUs by display size, colour palette and intended price range. Send the SKU list, quantity per model, destination and packaging needs for a wholesale quotation. A seasonal sleeve or branded box can be discussed as a separate custom packaging project; scope, minimum quantities and timing need confirmation.",
    questions: [
      { question: "Does every flower set include a vase or pot?", answer: "Check the selected model's images, description and contents. The display format varies across the range, so confirm the included container before ordering." },
      { question: "Can I request packaging for a botanical gift collection?", answer: "Share the chosen SKUs, artwork requirements, order quantities and target market through Custom Solutions. Packaging feasibility and sample approval are reviewed for the specific project." },
    ],
    links: [
      { label: "Explore the Flowers building set", href: "/products/flowers" },
      { label: "View the Bluebell building set", href: "/products/92360-jiestar-bluebell-building-block-set" },
      { label: "Custom packaging planning guide", href: "/blog/custom-packaging-for-building-block-toys" },
      { label: "Private label planning for retailers", href: "/blog/private-label-building-blocks-for-retailers" },
    ],
  },
  vehicles: {
    updatedAt: "2026-09-21",
    seoTitle: "Vehicle Building Block Sets & Car Model Kits | JIESTAR",
    description: "Browse car, truck and motorcycle building block sets. Compare model size, scale and listed functions for your next build or a wholesale vehicle assortment.",
    heading: "Vehicle Building Block Sets & Car Model Kits",
    intro: "Explore vehicle building sets, from car model kits and motorcycles to trucks and themed vehicles. Compare the model's scale, finished dimensions and listed functions to choose a build for your collection or retail range.",
    guideTitle: "Compare vehicle models before you build",
    selection: [
      { title: "Choose the vehicle and display size", text: "A compact car and a large motorcycle make different demands on a shelf. Use the finished dimensions to plan your space, and compare scale only where it is specified for the individual model." },
      { title: "Check the functions and included parts", text: "Look for an explicit description of steering, moving mechanisms, lighting or motorized features. Confirm which parts are included and any power requirements; a vehicle's appearance alone does not establish remote-control capability." },
      { title: "Compare single models and bundles", text: "Read the listing to confirm whether you are ordering one model, a selected variant or a bundle. Check the SKU and recommended age as well as the piece count when choosing a project or gift." },
    ],
    wholesaleTitle: "Building a vehicle range for retail",
    wholesale: "Group your shortlist by vehicle type, display size and intended customer. Include the exact SKUs, quantities and delivery market in an inquiry, and identify any powered models so their packaging and shipping requirements can be checked. For an exclusive vehicle concept or branded packaging, send a separate project brief with your references, budget direction and required approvals.",
    questions: [
      { question: "Are all vehicle sets motorized or remote controlled?", answer: "Functions vary by model. Order on the basis of the selected product's specifications and included components, and ask for clarification if motor, controller or battery information is missing." },
      { question: "How should I compare car and motorcycle model sizes?", answer: "Use the finished length, width and height on the product page. A stated scale is useful within a model type, but it does not replace the actual dimensions when planning a mixed display." },
    ],
    links: [
      { label: "View the 1:8 Rally Sports Car model", href: "/products/57010-jiestar-1-8-building-block-set" },
      { label: "Compare the Ninja 1000Sx motorcycle set", href: "/products/58053-jiestar-ninja-1000sx-building-block-set" },
      { label: "Wholesale MOQ and quotation guide", href: "/blog/building-block-sets-wholesale-moq-pricing-packaging-shipping" },
      { label: "OEM and ODM project planning", href: "/blog/oem-vs-odm-building-blocks" },
    ],
  },
  "ships-boats": {
    updatedAt: "2026-09-21",
    seoTitle: "Ship Building Block Sets & Boat Model Kits | JIESTAR",
    description: "Explore ship building block sets, sailboats and pirate models. Compare hull length, mast height and display details, with wholesale and custom inquiry options.",
    heading: "Ship & Boat Building Block Sets",
    intro: "Explore ship model kits, sailboats and pirate-themed building sets for a maritime display. Compare the hull shape, deck details and finished size to find a model that fits your shelf and building interests.",
    guideTitle: "Plan a display for your ship model",
    selection: [
      { title: "Allow room for hulls and masts", text: "Check the complete model's length, width and height before choosing a shelf. Sails, masts and projecting details can need more clearance than the hull itself; use the finished dimensions in the listing." },
      { title: "Choose a maritime theme", text: "A sailboat, a naval vessel and a pirate scene offer different visual details. Compare the product gallery for deck features, scenery and the included display arrangement rather than selecting by piece count alone." },
      { title: "Review the contents and build", text: "Check the recommended age and whether the listing covers a single ship, a scene or a bundle. Confirm the stand and accessories shown in the description before planning a larger display." },
    ],
    wholesaleTitle: "Selecting ships for a collector or gift range",
    wholesale: "Shortlist models by maritime theme, finished size and shelf price direction. A wholesale request should identify SKUs, units per model, carton information needed and the delivery destination. For a custom vessel or themed packaging, supply reference material you are entitled to use, your display-size target and quantity range for a feasibility review.",
    questions: [
      { question: "Can these ship models be used in water?", answer: "This category is presented as building and display models. Only treat a specific set as suitable for water if its product instructions expressly confirm that use; a boat-shaped model does not establish that it floats." },
      { question: "What dimensions matter for a ship display?", answer: "Check the total length and the height including masts or sails, along with the width and any stand. Leave access space around delicate details when choosing the display position." },
    ],
    links: [
      { label: "Explore the Ocean 65 Sailboat model", href: "/products/58123-jiestar-ocean-65-sailboat-building-block-set" },
      { label: "View the Spartan Warship model", href: "/products/58002-jiestar-spartan-warship-building-block-set" },
      { label: "Discover the X78009 ship release", href: "/blog/new-jiestar-ship-model-x78009" },
      { label: "Prepare a wholesale quotation request", href: "/blog/building-block-sets-wholesale-moq-pricing-packaging-shipping" },
    ],
  },
  "buildings-street-scenes": {
    updatedAt: "2026-09-21",
    seoTitle: "Architecture & Street Scene Building Block Sets | JIESTAR",
    description: "Explore architecture building sets, shops and street scene models. Compare footprints, facades and interior details for a display or wholesale city assortment.",
    heading: "Architecture & Street Scene Building Block Sets",
    intro: "Build a street scene with architecture models, shops, libraries and city-inspired sets. Compare facades, interior details and finished footprints to choose a standalone building or plan a coordinated display.",
    guideTitle: "Choose buildings for your street scene",
    selection: [
      { title: "Start with the footprint", text: "Check the base width and depth as well as the roof height. Leave space to view the facade and access any interiors described in the listing, particularly when placing several buildings on one shelf." },
      { title: "Compare architectural details", text: "A bookstore, library and garden building can give a display different focal points. Use the gallery to compare storefronts, rooflines and room details, and check which lighting parts or accessories are explicitly included." },
      { title: "Plan how models sit together", text: "Compare base sizes, scale information and connection details before combining sets. A shared street theme does not establish that two models connect; each can also be arranged as a separate display piece." },
    ],
    wholesaleTitle: "Planning an architecture and city assortment",
    wholesale: "For a specialty store or collector range, group buildings by architectural style, footprint and intended price range. Send selected SKUs, quantities and destination for a quotation, and flag models with lighting so their included components can be checked. A custom storefront or landmark brief should include authorized references, target dimensions and packaging requirements for project review.",
    questions: [
      { question: "Will every street scene set connect to the others?", answer: "Check the individual base dimensions and connection system before ordering. The category groups related themes; it does not promise a common modular format or scale across all products." },
      { question: "Do the building sets include lighting?", answer: "Some listings identify lighting accessories, while others do not. Confirm the chosen model's contents and power requirements instead of assuming lights are included throughout the collection." },
    ],
    links: [
      { label: "Explore the Tree House building set", href: "/products/tree-house" },
      { label: "View the Medieval European Library", href: "/products/57016-jiestar-medieval-european-library-building-block-set-with-led-lights" },
      { label: "Discover the X68003 and X68004 street models", href: "/blog/new-jiestar-architecture-street-view-x68003-x68004" },
      { label: "Plan an OEM or ODM building project", href: "/blog/oem-vs-odm-building-blocks" },
    ],
  },
};

export function getCollectionBuyingContent(handle: string): CollectionBuyingContent | undefined {
  return Object.hasOwn(collectionContent, handle) ? collectionContent[handle] : undefined;
}
