import Image from "next/image";
import Link from "next/link";
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
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createSpanishMetadata } from "@/lib/i18n/metadata";

export const metadata = createSpanishMetadata({
  title: "Bloques de construcción al por mayor y OEM/ODM | JIESTAR",
  description:
    "Sección comercial B2B en español de JIESTAR para juegos y bloques de construcción al por mayor, suministro internacional, OEM/ODM y desarrollo a medida.",
  path: "/",
});

const businessPaths = [
  {
    title: "Suministro mayorista",
    text: "Revise líneas de producto existentes, el catálogo mayorista, las cantidades y las opciones de suministro para su canal.",
    href: "/es/wholesale",
    cta: "Solicitar información mayorista",
    icon: StoreIcon,
  },
  {
    title: "Desarrollo OEM / ODM",
    text: "Hable con el equipo sobre el concepto, la estructura, la presentación, el embalaje y los requisitos comerciales de un producto a medida.",
    href: "/es/custom-solutions",
    cta: "Explorar soluciones a medida",
    icon: FactoryIcon,
  },
  {
    title: "Desarrollo conjunto de productos",
    text: "Planifique SKU exclusivos, líneas diferenciadas o una colaboración a largo plazo para una marca propia.",
    href: "/es/custom-solutions",
    cta: "Iniciar una conversación",
    icon: SparkIcon,
  },
];

const buyerProfiles = [
  ["Distribuidores", "Selección de categorías y planificación de suministro para mercados regionales."],
  ["Minoristas", "Productos con valor de exhibición para tiendas, cadenas especializadas y programas de regalo."],
  ["Comercio electrónico", "Productos visualmente atractivos para plataformas de comercio electrónico, tiendas propias y ventas mediante contenido."],
  ["Marcas y socios", "Desarrollo de productos, presentación de marca y programas exclusivos por mercado."],
];

const workflow = [
  ["01", "Comparta su mercado", "Indique país, canal, categoría de interés y objetivo comercial."],
  ["02", "Revisión de opciones", "El equipo analiza si conviene una línea existente o un proyecto a medida."],
  ["03", "Seguimiento directo", "Continúe por correo o WhatsApp para revisar productos, cantidades, embalaje y logística."],
];

export default function SpanishHomePage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-40">
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

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.68fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">
              Sección comercial B2B en español
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-[58px]">
              Bloques de construcción al por mayor para distribuidores, importadores y marcas
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Conozca el suministro mayorista de juegos y juguetes de construcción y las soluciones OEM / ODM de JIESTAR para crear una oferta adecuada a su canal y mercado.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <HeroBannerButton href="/es/wholesale">Solicitar catálogo mayorista</HeroBannerButton>
              <HeroBannerButton href="/es/custom-solutions" variant="secondary">
                Presentar un proyecto
              </HeroBannerButton>
              <Link
                href="/products"
                hrefLang="en"
                prefetch={false}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/25 bg-white/5 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto"
              >
                Ver catálogo en inglés
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Dos modalidades de colaboración</p>
                <p className="text-sm text-slate-400">Producto existente o desarrollo a medida</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Venta mayorista</dt>
                <dd className="mt-1 text-sm font-semibold leading-6 text-white">Catálogo, selección e información comercial compartida directamente</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Soluciones a medida</dt>
                <dd className="mt-1 text-sm font-semibold leading-6 text-white">OEM / ODM, SKU exclusivo y desarrollo conjunto</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Siguiente paso</dt>
                <dd className="mt-1 text-sm font-semibold leading-6 text-white">Cuéntenos su mercado, canal y categoría de interés</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Opciones de colaboración"
            title="Una modalidad clara para cada proyecto"
            description="Empiece por productos existentes o plantee una colaboración con un mayor nivel de personalización."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {businessPaths.map(({ title, text, href, cta, icon: Icon }) => (
              <article key={title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{text}</p>
                <Link href={href} className="mt-5 inline-flex items-center text-sm font-black text-red-600 hover:text-red-700">
                  {cta}
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Para compradores profesionales"
              title="Diseñado para diferentes canales de venta"
              description="La primera conversación se centra en su mercado y en el tipo de producto que necesita, no en una propuesta genérica."
            />
            <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold leading-6 text-slate-800">
                El catálogo completo permanece en inglés durante esta primera etapa. El equipo puede orientar la selección en español mediante una consulta directa.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {buyerProfiles.map(([title, text]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Cómo empezar"
              title="De la necesidad comercial a una conversación concreta"
              description="Un proceso inicial breve ayuda a identificar la opción adecuada antes de evaluar cantidades, muestras o necesidades de desarrollo."
            />
            <div className="mt-8 grid gap-4">
              {workflow.map(([number, title, text]) => (
                <article key={number} className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-md bg-red-600 text-sm font-black text-white">{number}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-lg">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/site-visuals/showroom/showroom-sample-consultation.webp"
                alt="Mesa de consulta con muestras, embalajes y catálogos de JIESTAR"
                fill
                unoptimized
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover object-[center_48%]"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <PackageIcon className="size-5 text-red-300" />
                <h2 className="text-lg font-semibold">Evaluación del producto y de la colaboración</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Comparta la categoría, la cantidad estimada, el mercado objetivo y las necesidades de embalaje para facilitar una respuesta relevante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex size-11 items-center justify-center rounded-md bg-white text-slate-950">
              <ShieldIcon className="size-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Hablemos de su mercado y de la modalidad adecuada</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              Consulte productos existentes o presente un proyecto OEM / ODM con sus requisitos iniciales.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <LinkButton href="/es/contact" variant="dark">Contactar con JIESTAR</LinkButton>
            <LinkButton href="/es/quality-safety" variant="inverse">
              Calidad y seguridad
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
