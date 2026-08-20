import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpanishInquiryForm } from "@/components/i18n/SpanishInquiryForm";
import {
  ArrowRightIcon,
  FactoryIcon,
  GlobeIcon,
  PackageIcon,
  ShieldIcon,
  SparkIcon,
  StoreIcon,
} from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createSpanishMetadata } from "@/lib/i18n/metadata";
import { createBreadcrumbJsonLd, createJsonLdScript } from "@/lib/seo";

export const metadata = createSpanishMetadata({
  title: "Bloques de construcción a medida y OEM/ODM | JIESTAR",
  description:
    "Desarrollo B2B de juguetes y bloques de construcción a medida con JIESTAR: OEM/ODM, SKU exclusivos, embalaje, marca propia y líneas diferenciadas.",
  path: "/custom-solutions",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Inicio", path: "/es" },
  { name: "Soluciones a medida", path: "/es/custom-solutions" },
]);

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const capabilities: Array<[string, string, IconComponent]> = [
  ["Personalización OEM / ODM", "Personalice el concepto del producto, los detalles del modelo, la presentación, el logotipo y el embalaje.", FactoryIcon],
  ["Desarrollo conjunto", "Parta de una idea, un público objetivo y una meta de lanzamiento para desarrollar una propuesta diferenciada.", SparkIcon],
  ["Embalaje y marca", "Consulte opciones para el formato del embalaje, la identidad visual y la presentación en el canal de venta.", PackageIcon],
  ["SKU exclusivo", "Planifique una versión dedicada para un canal, plataforma, campaña o mercado regional.", StoreIcon],
  ["Línea de producto", "Desarrolle una serie con una categoría, una identidad visual y un calendario de lanzamientos coherentes.", GlobeIcon],
  ["Marca propia o línea exclusiva", "Explore una relación a largo plazo que integre producto, embalaje y posicionamiento.", ShieldIcon],
];

const projectDirections = [
  {
    title: "Modelos de exhibición",
    text: "Analice escala, presencia visual, complejidad de construcción y adecuación al público objetivo.",
    image: "/images/site-visuals/showroom/showroom-feature-models.webp",
    alt: "Modelos grandes de bloques de construcción expuestos en la sala de JIESTAR",
  },
  {
    title: "Regalos y líneas botánicas",
    text: "Explore opciones de producto para temporadas, estilo de vida, regalos y exhibición en tienda.",
    image: "/images/site-visuals/showroom/showroom-flower-wall.webp",
    alt: "Productos botánicos de bloques de construcción en una pared de exhibición",
  },
  {
    title: "Arquitectura y ciudad",
    text: "Compare formas, escala y valor de exhibición para coleccionistas y canales especializados.",
    image: "/images/site-visuals/showroom/showroom-city-models.webp",
    alt: "Modelos urbanos y arquitectónicos de bloques de construcción en exposición",
  },
];

const process = [
  ["01", "Resumen del proyecto", "Comparta mercado, categoría, tipo de colaboración, cantidad aproximada y objetivo de lanzamiento."],
  ["02", "Enfoque del producto", "Revise el concepto, el nivel de personalización, el embalaje, la presentación y el encaje comercial."],
  ["03", "Alcance y muestra", "Confirme los requisitos, el plazo estimado, el volumen previsto y el proceso de aprobación."],
  ["04", "Planificación", "Alinee el producto, el embalaje, el pedido y los requisitos de lanzamiento antes de avanzar."],
];

const faqs = [
  [
    "¿En qué se diferencia de la venta mayorista?",
    "La venta mayorista se centra en productos existentes. La sección Soluciones a medida abarca OEM / ODM, desarrollo de productos, SKU exclusivos y proyectos para una marca propia.",
  ],
  [
    "¿Puedo presentar una idea sin tener todos los detalles definidos?",
    "Sí. Un mercado objetivo, una categoría, la necesidad principal y una cantidad aproximada son suficientes para una primera revisión.",
  ],
  [
    "¿El proyecto puede incluir embalaje y logotipo?",
    "El embalaje y la presentación de marca pueden formar parte del alcance, sujetos a la evaluación concreta del proyecto.",
  ],
  [
    "¿JIESTAR contempla colaboraciones de largo plazo?",
    "Sí. Se puede conversar sobre planificación de productos, desarrollo, embalaje y presentación dentro de una relación a largo plazo.",
  ],
];

export default function SpanishCustomSolutionsPage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(breadcrumbJsonLd)} />

      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/showroom/showroom-entrance-overview.webp"
            alt="Sala de exposición de JIESTAR con modelos y presentación de marca"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-[center_48%]"
          />
          <div className="absolute inset-0 bg-slate-950/75" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400" aria-label="Ruta de navegación">
              <Link href="/es" className="font-semibold transition hover:text-white">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-white">Soluciones a medida</span>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">OEM / ODM · Desarrollo de productos a medida</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Desarrollo OEM / ODM de bloques de construcción a medida
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Presente a JIESTAR un proyecto de juguetes de construcción OEM / ODM, un SKU exclusivo, una línea diferenciada o una propuesta para una marca propia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <HeroBannerButton href="#project-form">Presentar un proyecto</HeroBannerButton>
              <HeroBannerButton href="#capabilities" variant="secondary">Ver capacidades</HeroBannerButton>
              <HeroBannerButton href="/es/wholesale" variant="secondary">
                Venta mayorista
                <ArrowRightIcon className="ml-2 size-4" />
              </HeroBannerButton>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <SparkIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Resumen de colaboración</p>
                <p className="text-sm text-slate-400">Para proyectos más allá del catálogo en inglés</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              {[
                ["Alcance", "OEM / ODM, desarrollo conjunto, marca propia y línea exclusiva"],
                ["Enfoque", "Productos y líneas diferenciadas"],
                ["Primer paso", "Mercado, concepto y cantidad aproximada"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold leading-6 text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-24 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Capacidades"
            title="Una colaboración adaptada al nivel de personalización"
            description="Defina con el equipo qué debe mantenerse, modificarse o desarrollarse para su mercado y canal."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([title, text, Icon]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Categorías de referencia"
            title="Utilice referencias de categoría para explicar su idea"
            description="Las imágenes ayudan a conversar sobre escala, audiencia, presencia visual y posicionamiento; no representan una propuesta cerrada."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {projectDirections.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover object-[center_45%]"
                  />
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Proceso inicial"
            title="Del resumen del proyecto a la planificación"
            description="Cada etapa se confirma según el alcance real; la consulta inicial no implica una aprobación automática del proyecto."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map(([number, title, text]) => (
              <article key={number} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-red-600">{number}</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
              <ShieldIcon className="size-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Empiece por compartir su necesidad comercial</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              El equipo podrá evaluar el enfoque del producto, el nivel de personalización y la información adicional necesaria para continuar.
            </p>
          </div>
          <HeroBannerButton href="#project-form">Iniciar consulta</HeroBannerButton>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Antes de presentar un proyecto"
            description="Información inicial sobre alcance, datos necesarios y formas de colaboración."
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

      <section id="project-form" className="scroll-mt-24 px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.02fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Consulta"
              title="Presente su proyecto a JIESTAR"
              description="Comparta el tipo de colaboración, mercado, categoría, necesidades de personalización y cantidad estimada."
            />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Detalles que facilitan la revisión</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {[
                  "Mercado y canal de venta objetivo",
                  "Categoría, concepto o referencia de producto",
                  "Necesidades de embalaje, logotipo o marca",
                  "Cantidad estimada y fecha objetivo de lanzamiento",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Antes de avanzar, consulte nuestro enfoque de{" "}
                <Link href="/es/quality-safety" className="font-semibold text-red-700 underline underline-offset-4">
                  calidad, seguridad y documentación por mercado
                </Link>
                .
              </p>
            </div>
          </div>
          <SpanishInquiryForm type="custom" sourcePath="/es/custom-solutions" />
        </div>
      </section>
    </div>
  );
}
