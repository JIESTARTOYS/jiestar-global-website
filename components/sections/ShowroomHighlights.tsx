import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";

const showroomCards = [
  {
    label: "Showroom overview",
    title: "A physical space for product review",
    note: "Partners can review product directions, display presence, and category fit in a real JIESTAR showroom setting.",
    image: "/images/site-visuals/showroom/showroom-entrance-overview.webp",
    alt: "JIESTAR showroom entrance with product displays and brand wall",
    className: "lg:col-span-2 lg:row-span-2",
    imageClassName: "object-[center_48%]",
    sizes: "(min-width: 1024px) 50vw, 100vw",
  },
  {
    label: "Feature models",
    title: "Large display builds",
    note: "Larger model displays help buyers judge shelf impact and product direction.",
    image: "/images/site-visuals/showroom/showroom-feature-models.webp",
    alt: "Large building block display models arranged in the JIESTAR showroom",
    className: "lg:col-span-2",
    imageClassName: "object-[center_45%]",
    sizes: "(min-width: 1024px) 24vw, 100vw",
  },
  {
    label: "Gift categories",
    title: "Botanical display lines",
    note: "Flower and gift-oriented products show how the range can work beyond vehicle and city model categories.",
    image: "/images/site-visuals/showroom/showroom-flower-wall.webp",
    alt: "Flower building block products displayed on a JIESTAR showroom wall",
    className: "lg:col-span-2",
    imageClassName: "object-[center_45%]",
    sizes: "(min-width: 1024px) 24vw, 100vw",
  },
];

export function ShowroomHighlights() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-red-600">Showroom</p>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-normal text-slate-950 sm:text-3xl">
              Product range you can review beyond a catalog
            </h2>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              The showroom adds a buyer-facing layer to JIESTAR: real product displays for category review, retail presentation, and early custom cooperation conversations.
            </p>
            <LinkButton href="/custom-solutions" className="shrink-0">
              Start a Project
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </LinkButton>
          </div>
        </div>

        <div className="mt-6 grid auto-rows-[minmax(16rem,auto)] gap-4 lg:grid-cols-4">
          {showroomCards.map((card) => (
            <article
              key={card.label}
              className={`group relative flex min-h-64 overflow-hidden rounded-lg bg-slate-950 p-5 text-white ${card.className ?? ""}`}
            >
              <Image
                src={card.image}
                alt={card.alt}
                fill
                unoptimized
                sizes={card.sizes}
                className={`object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] ${card.imageClassName}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/5" />
              <div className="relative mt-auto max-w-md">
                <p className="text-xs font-black uppercase tracking-normal text-red-200">{card.label}</p>
                <h3 className="mt-2 text-xl font-black leading-tight tracking-normal">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200">{card.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
