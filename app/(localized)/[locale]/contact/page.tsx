import Image from "next/image";
import Link from "next/link";
import { SpanishInquiryForm } from "@/components/i18n/SpanishInquiryForm";
import { ArrowRightIcon, FactoryIcon, PackageIcon, ShieldIcon, StoreIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { siteConfig } from "@/lib/data";
import { createSpanishMetadata } from "@/lib/i18n/metadata";
import { createBreadcrumbJsonLd, createJsonLdScript } from "@/lib/seo";

export const metadata = createSpanishMetadata({
  title: "Contacto para venta mayorista y OEM/ODM | JIESTAR",
  description:
    "Contacto B2B en español de JIESTAR para solicitar catálogo mayorista, cotización de bloques de construcción y evaluación de proyectos OEM/ODM a medida.",
  path: "/contact",
});

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: "Inicio", path: "/es" },
  { name: "Contacto", path: "/es/contact" },
]);

const contactPaths = [
  {
    title: "Venta mayorista",
    text: "Catálogo de bloques de construcción al por mayor, selección de productos, cantidades y suministro para distribuidores, minoristas e importadores.",
    href: "/es/wholesale",
    cta: "Ver venta mayorista",
    icon: StoreIcon,
  },
  {
    title: "Soluciones a medida",
    text: "OEM / ODM, desarrollo de productos a medida, SKU exclusivos, embalaje, marca propia y líneas diferenciadas.",
    href: "/es/custom-solutions",
    cta: "Ver soluciones a medida",
    icon: FactoryIcon,
  },
  {
    title: "Calidad y documentación",
    text: "Conozca cómo se revisan los materiales, el producto y el embalaje, y qué documentación puede requerir cada mercado.",
    href: "/es/quality-safety",
    cta: "Ver calidad y seguridad",
    icon: ShieldIcon,
  },
];

export default function SpanishContactPage() {
  return (
    <div className="bg-[#f7f8fa] px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={createJsonLdScript(breadcrumbJsonLd)} />

      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500" aria-label="Ruta de navegación">
          <Link href="/es" className="font-semibold transition hover:text-red-600">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-950">Contacto</span>
        </nav>

        <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-black uppercase text-red-600">Contacto B2B en español</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Solicite información mayorista o presente un proyecto OEM / ODM
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Esta página atiende consultas comerciales en español. Explique su mercado, su canal y su necesidad principal para orientar la respuesta hacia venta mayorista, desarrollo a medida o atención al cliente.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Consultas comerciales</p>
                <Link
                  href={`mailto:${siteConfig.businessEmail}`}
                  className="mt-2 inline-flex break-all text-sm font-black text-slate-950 transition hover:text-red-600"
                >
                  {siteConfig.businessEmail}
                </Link>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-500">Atención al cliente</p>
                <Link
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="mt-2 inline-flex break-all text-sm font-black text-slate-950 transition hover:text-red-600"
                >
                  {siteConfig.supportEmail}
                </Link>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src="/images/site-visuals/showroom/showroom-sample-consultation.webp"
                  alt="Mesa de consulta con muestras, embalajes y catálogos de productos JIESTAR"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="object-cover object-[center_48%]"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-black text-red-200">Consultas sobre muestras y colaboración</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                  Un único punto de contacto para consultas de producto, venta mayorista y proyectos a medida.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 sm:p-5">
            <SpanishInquiryForm type="contact" sourcePath="/es/contact" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {contactPaths.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
                <span className="flex size-10 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <Link href={item.href} className="mt-4 inline-flex items-center text-sm font-black text-red-600 transition hover:text-red-700">
                  {item.cta}
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
              <PackageIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black">Antes de enviar una consulta de producto</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Incluya categoría, cantidad aproximada, mercado, fecha objetivo y necesidades de embalaje o personalización.
              </p>
            </div>
          </div>
          <LinkButton href="/es/wholesale" variant="dark">Consulta mayorista</LinkButton>
        </section>

        <p className="mt-5 text-center text-sm text-slate-500">
          El catálogo completo de productos permanece en inglés.{" "}
          <Link href="/products" hrefLang="en" className="font-semibold text-red-700 underline underline-offset-4">
            Ver catálogo en inglés
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
