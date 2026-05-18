import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, FactoryIcon, PackageIcon, StoreIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";

const paths = [
  {
    title: "Retail purchase",
    text: "Browse building block sets and continue through secure checkout.",
    href: "/products",
    icon: StoreIcon,
  },
  {
    title: "Wholesale supply",
    text: "Request catalog follow-up for channel buying and MOQ discussion.",
    href: "/wholesale",
    icon: PackageIcon,
  },
  {
    title: "Custom development",
    text: "Plan OEM / ODM, exclusive SKUs, or long-term product lines.",
    href: "/custom-solutions",
    icon: FactoryIcon,
  },
];

export function FinalCTA() {
  return (
    <section className="bg-[#f6f7f9] px-5 pb-10 pt-4 lg:px-8 lg:pb-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
        <div className="grid lg:grid-cols-[1fr_0.48fr]">
          <div className="bg-slate-950 px-6 py-10 text-white sm:px-10 lg:py-12">
            <p className="text-sm font-black uppercase text-red-300">Choose your next JIESTAR path</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-normal sm:text-4xl">
              Explore products, request supply, or start a custom building block project.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              JIESTAR supports direct shoppers, wholesale buyers, and long-term product partners through one global brand website.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/products" variant="dark" className="min-w-44">
                Explore Products
              </LinkButton>
              <Link
                href="/contact"
                className="inline-flex min-h-11 min-w-52 items-center justify-center rounded-md border border-white/70 px-6 py-3 text-sm font-bold text-white transition duration-200 hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start a Business Inquiry
              </Link>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {paths.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-red-300 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-950">
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-red-200" />
                    </div>
                    <h3 className="mt-4 text-sm font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{item.text}</p>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="relative min-h-72 bg-slate-100 lg:min-h-full">
            <Image
              src="https://cdn.shopify.com/s/files/1/0804/0824/8569/files/main_0_b9420112-d71a-4363-9e68-8a06ab12bfa1.webp?v=1778226575"
              alt="JIESTAR building block display model"
              fill
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_20%,rgba(15,23,42,.62)_100%)]" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs font-black uppercase text-red-200">Global brand hub</p>
              <p className="mt-2 text-lg font-black leading-6">DTC shopping and B2B cooperation in one site.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
