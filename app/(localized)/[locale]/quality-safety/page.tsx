import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Blocks, Headphones, PackageCheck, SearchCheck, SwatchBook, type LucideIcon } from "lucide-react";
import { ArrowRightIcon, FactoryIcon, ShieldIcon, SparkIcon } from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createSpanishMetadata } from "@/lib/i18n/metadata";
import { createBreadcrumbJsonLd, createJsonLdScript } from "@/lib/seo";

export const metadata = createSpanishMetadata({
  title: "Calidad y seguridad de juguetes de construcción | JIESTAR",
  description:
    "Información B2B de JIESTAR sobre control de calidad de juguetes de construcción, seguridad, inspección, embalaje y documentación según producto y mercado.",
  path: "/quality-safety",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Inicio", path: "/es" },
  { name: "Calidad y seguridad", path: "/es/quality-safety" },
]);

type ProcessStep = {
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

const trustStrip = [
  ["Materiales", "Revisión centrada en ABS", SwatchBook],
  ["Construcción", "Ajuste y estabilidad", Blocks],
  ["Inspección", "Flujo de varias etapas", SearchCheck],
  ["Servicio", "Soporte para piezas faltantes", Headphones],
] as const;

const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Revisión de materiales",
    text: "Se revisan la adecuación del material, la apariencia y los requisitos del producto antes de avanzar.",
    icon: SwatchBook,
  },
  {
    number: "02",
    title: "Inspección de piezas",
    text: "Se observan consistencia de color, defectos visibles, ajuste y detalles propios de la categoría.",
    icon: SearchCheck,
  },
  {
    number: "03",
    title: "Prueba de ajuste y construcción",
    text: "Se revisan la experiencia de montaje, la estabilidad del modelo y su adecuación al público objetivo.",
    icon: Blocks,
  },
  {
    number: "04",
    title: "Revisión del modelo terminado",
    text: "Se comprueban el resultado final, funciones principales, proporciones e instrucciones de montaje.",
    icon: BadgeCheck,
  },
  {
    number: "05",
    title: "Embalaje y pedido",
    text: "Se revisan el embalaje, la identificación del SKU, las cantidades y la preparación del envío.",
    icon: PackageCheck,
  },
  {
    number: "06",
    title: "Soporte posventa",
    text: "El equipo atiende solicitudes de piezas faltantes, preguntas sobre productos y consultas de socios comerciales.",
    icon: Headphones,
  },
];

const documentationTypes = [
  "Declaración UE de conformidad y marcado CE cuando resulten aplicables",
  "Informes relacionados con EN 71",
  "Requisitos aplicables de ASTM F963",
  "Documentación relacionada con la CPSIA y el certificado CPC",
  "Revisión de sustancias restringidas",
  "Documentación según la edad recomendada y el mercado",
];

const certificatePreviews = [
  {
    title: "Declaración UE / Reino Unido",
    src: "/images/site-visuals/certificates/eu-declaration-preview.jpg",
    alt: "Vista previa reducida de una declaración de documentación de seguridad",
  },
  {
    title: "Documentación CPC",
    src: "/images/site-visuals/certificates/cpc-preview.jpg",
    alt: "Vista previa reducida de un documento Children's Product Certificate",
  },
  {
    title: "Informe relacionado con EN 71",
    src: "/images/site-visuals/certificates/en71-report-preview.jpg",
    alt: "Vista previa reducida de la portada de un informe relacionado con EN 71",
  },
];

const faqs = [
  [
    "¿La documentación es la misma para todos los productos?",
    "No. La documentación aplicable depende del producto, la edad indicada, el mercado de destino y el alcance del pedido.",
  ],
  [
    "¿Puedo solicitar documentación antes de confirmar un pedido?",
    "Puede indicar las necesidades de su mercado durante la consulta. El equipo revisará qué información corresponde al producto y al proyecto concretos.",
  ],
  [
    "¿Dónde se solicitan piezas faltantes?",
    "Escriba a support@jiestartoys.com con los datos del producto, la pieza y la compra para que el equipo pueda revisar el caso.",
  ],
];

export default function SpanishQualitySafetyPage() {
  return (
    <div className="bg-[#f6f7f9] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(breadcrumbJsonLd)} />

      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/factory/manual-sorting-review.webp"
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400" aria-label="Ruta de navegación">
              <Link href="/es" className="font-semibold transition hover:text-white">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Calidad y seguridad</span>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Calidad y documentación para socios B2B</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Calidad, seguridad y documentación para bloques de construcción
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Conozca el enfoque de revisión de materiales, ajuste, inspección, embalaje y soporte para juguetes de construcción, con un alcance definido según el producto y el mercado de destino.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <HeroBannerButton href="/es/contact">Contactar con ventas</HeroBannerButton>
              <Link
                href="/products"
                hrefLang="en"
                prefetch={false}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/25 bg-white/5 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10 sm:w-auto"
              >
                Ver catálogo en inglés
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <ShieldIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Resumen de calidad</p>
                <p className="text-sm text-slate-400">Producto, embalaje y soporte</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Materiales</dt>
                <dd className="mt-1 text-sm font-semibold text-white">Revisión centrada en ABS</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Construcción</dt>
                <dd className="mt-1 text-sm font-semibold text-white">Ajuste, estabilidad y resultado final</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Documentación</dt>
                <dd className="mt-1 text-sm font-semibold text-white">Aplicabilidad según producto y mercado</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="bg-[#F6F8FC] px-4 pb-8 sm:px-5 lg:px-8">
        <div className="relative z-10 mx-auto -mt-7 grid max-w-7xl overflow-hidden rounded-2xl border border-[#DFE6F0] bg-white shadow-xl shadow-slate-950/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map(([label, value, Icon]) => (
            <article key={label} className="flex items-center gap-4 border-b border-[#DFE6F0] p-5 last:border-b-0 sm:[&:nth-child(3)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-black leading-5 text-slate-950">{value}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Flujo de revisión"
            title="Desde el material hasta el soporte posventa"
            description="El alcance de cada comprobación depende del producto, el pedido y las necesidades del mercado."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {processSteps.map(({ number, title, text, icon: Icon }) => (
              <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-red-600">{number}</span>
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Mercados internacionales"
              title="Documentación según el producto y el mercado de destino"
              description="Estos son ejemplos de documentación que puede resultar pertinente. La disponibilidad y aplicabilidad de cada documento deben confirmarse para cada SKU, pedido y mercado de destino."
            />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {documentationTypes.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-red-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {certificatePreviews.map((item) => (
              <figure key={item.title} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                <div className="relative aspect-[4/3] bg-white">
                  <Image src={item.src} alt={item.alt} fill unoptimized sizes="(min-width: 1280px) 16vw, 33vw" className="object-cover object-top" />
                </div>
                <figcaption className="p-4 text-sm font-semibold text-slate-800">{item.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-7xl gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <FactoryIcon className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <p className="text-sm leading-6 text-amber-950">
            Confirme los requisitos aplicables al país de destino, la categoría y la edad recomendada, así como el alcance del pedido, antes de basar decisiones de importación o comercialización en cualquier documento.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Calidad, documentación y soporte"
            description="Puntos básicos antes de una consulta de producto o colaboración."
          />
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">{question}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
              <SparkIcon className="size-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Explique el producto y el mercado que desea revisar</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              El equipo podrá orientar la conversación sobre producto, embalaje, documentación y soporte aplicables al caso. Para proyectos OEM / ODM, consulte también nuestras{" "}
              <Link href="/es/custom-solutions" className="font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
                soluciones a medida
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <HeroBannerButton href="/es/contact">Contactar con JIESTAR</HeroBannerButton>
            <HeroBannerButton href="/es/wholesale" variant="secondary">Consulta mayorista</HeroBannerButton>
          </div>
        </div>
      </section>
    </div>
  );
}
