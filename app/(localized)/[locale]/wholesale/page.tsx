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
  StoreIcon,
  TruckIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { HeroBannerButton } from "@/components/ui/HeroBannerButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createSpanishMetadata } from "@/lib/i18n/metadata";
import { createBreadcrumbJsonLd, createJsonLdScript } from "@/lib/seo";

export const metadata = createSpanishMetadata({
  title: "Juegos y bloques de construcción al por mayor | JIESTAR",
  description:
    "Catálogo B2B en español de JIESTAR para evaluar juegos y bloques de construcción al por mayor con distribuidores, importadores, jugueterías y minoristas.",
  path: "/wholesale",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Inicio", path: "/es" },
  { name: "Venta mayorista", path: "/es/wholesale" },
]);

const buyerProfiles = [
  ["Mayoristas de juguetes", "Amplíe su oferta con distintas categorías de bloques de construcción."],
  ["Distribuidores", "Evalúe líneas de producto para su mercado regional y su red comercial."],
  ["Minoristas", "Seleccione productos para tiendas especializadas, cadenas, regalos y exhibición."],
  ["Vendedores de comercio electrónico", "Evalúe opciones para plataformas de comercio electrónico, tiendas propias y ventas mediante contenido."],
  ["Compradores del sector educativo", "Consulte opciones para programas de aprendizaje, regalos y actividades familiares."],
  ["Importadores", "Planifique la selección, las cantidades, el embalaje y la logística según el mercado de destino."],
];

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const advantages: Array<[string, string, IconComponent]> = [
  ["Catálogo mayorista", "Inicie una revisión de productos y precios mayoristas con el equipo de JIESTAR.", FactoryIcon],
  ["Selección por categoría", "Comparta su canal y mercado para orientar la conversación hacia las líneas más relevantes.", StoreIcon],
  ["Seguimiento comercial", "Continúe por correo o WhatsApp para tratar cantidades, embalaje, muestras y logística.", TruckIcon],
];

const process: Array<[string, string, string, IconComponent]> = [
  ["01", "Envío de consulta", "Deje su correo e incluya, si los conoce, su empresa, país, canal y categorías de interés.", UserIcon],
  ["02", "Revisión comercial", "El equipo revisa el perfil del comprador, el mercado y el enfoque del producto.", PackageIcon],
  ["03", "Selección y precios", "JIESTAR comparte directamente con el comprador la información necesaria para continuar la evaluación.", GlobeIcon],
  ["04", "Planificación", "Confirme muestras, cantidades, plazo, embalaje, envío y necesidades de reposición.", TruckIcon],
];

const faqs = [
  [
    "¿Puedo solicitar un catálogo antes de realizar un pedido?",
    "Sí. Puede dejar su correo electrónico para iniciar la revisión del catálogo antes de conversar sobre un pedido concreto.",
  ],
  [
    "¿Debo completar todos los campos?",
    "No. Para una solicitud mayorista solo es obligatorio el correo. Empresa, país, WhatsApp y categoría ayudan a preparar una respuesta más relevante.",
  ],
  [
    "¿Cómo se confirman las cantidades y la logística?",
    "Se revisan durante el seguimiento comercial, porque dependen del producto, el mercado de destino y el alcance del pedido.",
  ],
  [
    "¿Qué hago si necesito un embalaje propio o un producto exclusivo?",
    "Para OEM / ODM, embalaje personalizado, SKU exclusivos o desarrollo de una línea, consulte la sección Soluciones a medida.",
  ],
];

export default function SpanishWholesalePage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(breadcrumbJsonLd)} />

      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="/images/site-visuals/factory/warehouse-ready-stock.webp"
            alt="Cajas de productos JIESTAR preparadas en almacén para consultas mayoristas"
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
              <span className="font-semibold text-white">Venta mayorista</span>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-normal text-red-300">Bloques de construcción al por mayor</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-[56px]">
              Bloques de construcción al por mayor para distribuidores e importadores
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Solicite el catálogo mayorista y evalúe juegos de construcción para jugueterías, minoristas, distribuidores y vendedores de comercio electrónico.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <HeroBannerButton href="#wholesale-form">Solicitar catálogo</HeroBannerButton>
              <HeroBannerButton href="#process" variant="secondary">Ver el proceso</HeroBannerButton>
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
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Resumen de la solicitud</p>
                <p className="text-sm text-slate-400">Revisión antes de compartir precios</p>
              </div>
            </div>
            <dl className="grid gap-4 pt-5">
              {[
                ["Consulta", "Correo y perfil comercial"],
                ["Revisión", "Mercado, canal y categoría"],
                ["Seguimiento", "Producto, cantidades y logística"],
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

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Perfil de comprador"
            title="Para empresas que quieren evaluar primero la oferta mayorista"
            description="Comparta su canal y mercado para que la revisión del catálogo tenga un punto de partida concreto."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buyerProfiles.map(([title, text]) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeader
            eyebrow="Qué puede revisar"
            title="Una conversación comercial centrada en sus necesidades"
            description="Los precios y las condiciones se comparten directamente con el comprador después de revisar su perfil y el alcance de la consulta."
          />
          <div className="grid gap-4">
            {advantages.map(([title, text, Icon]) => (
              <article key={title} className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-24 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Proceso"
            title="De la solicitud a la planificación del pedido"
            description="La consulta inicial es sencilla; el seguimiento se adapta al mercado, al canal y a las categorías seleccionadas."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {process.map(([number, title, text, Icon]) => (
              <article key={number} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-red-600">{number}</span>
                  <Icon className="size-5 text-slate-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex gap-3 rounded-lg border border-red-100 bg-red-50 p-5">
            <ShieldIcon className="mt-0.5 size-5 shrink-0 text-red-600" />
            <p className="text-sm font-semibold leading-6 text-slate-800">
              Las cantidades mínimas, los precios, la disponibilidad y la logística se confirman por producto y pedido. Consulte también nuestro enfoque de{" "}
              <Link href="/es/quality-safety" className="text-red-700 underline underline-offset-4">
                calidad, seguridad y documentación
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-red-300">Más allá de la venta mayorista</p>
            <h2 className="mt-3 text-3xl font-semibold">¿Necesita un embalaje propio, un SKU exclusivo o desarrollo de producto?</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Consulte Soluciones a medida para presentar un proyecto OEM / ODM o una colaboración a largo plazo en el desarrollo de productos.
            </p>
          </div>
          <HeroBannerButton href="/es/custom-solutions">Ver soluciones a medida</HeroBannerButton>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Antes de solicitar el catálogo"
            description="Respuestas iniciales sobre la solicitud y el seguimiento mayorista."
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

      <section id="wholesale-form" className="scroll-mt-24 px-5 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.02fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Consulta"
              title="Solicite el catálogo mayorista"
              description="El correo electrónico es suficiente para empezar. Los detalles adicionales permiten orientar mejor el seguimiento."
            />
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Información útil</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                {[
                  "Empresa, país o región",
                  "Canal de venta y categorías de interés",
                  "Cantidad aproximada, si ya la conoce",
                  "WhatsApp u otro medio de contacto preferido",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SpanishInquiryForm type="wholesale" sourcePath="/es/wholesale" />
        </div>
      </section>
    </div>
  );
}
