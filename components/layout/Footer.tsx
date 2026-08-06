import Link from "next/link";
import { siteConfig } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SiteLogo } from "@/components/layout/SiteLogo";

const exploreLinks = [
  ["Home", "/"],
  ["Products", "/products"],
  ["U.S. Warehouse", "/us-warehouse"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

const b2bLinks = [
  ["Wholesale", "/wholesale"],
  ["Custom Solutions", "/custom-solutions"],
  ["Business Contact", "/contact"],
];

const supportLinks = [
  ["Replacement Parts", "/support/replacement-parts"],
  ["Shipping Policy", "/policies/shipping-policy"],
  ["Returns & Refunds", "/policies/refund-policy"],
  ["Contact Support", "/contact"],
];

const companyLinks = [
  ["About Us", "/about"],
  ["Quality & Safety", "/quality-safety"],
];

const legalLinks = [
  ["Privacy Policy", "/policies/privacy-policy"],
  ["Terms of Service", "/policies/terms-of-service"],
];

export function Footer() {
  return (
    <footer className="bg-slate-950 px-3 pb-3 text-white">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-t-lg bg-slate-950">
        <div className="grid gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_1fr_0.9fr_1.15fr_1.25fr] lg:gap-12 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <SiteLogo className="size-14" />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-300">{siteConfig.description}</p>
          </div>
          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Support" links={supportLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Partnership" links={b2bLinks} />
          <div className="min-w-0">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-normal text-white">Newsletter</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Get building ideas, new releases, and partnership updates.
              </p>
              <form className="mt-5 grid gap-3">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email"
                  className="h-11 rounded-md border border-white/10 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Subscribe
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 JIESTAR. Building dreams for creators, dreamers, and builders.</p>
          <div className="flex flex-wrap gap-5">
            {legalLinks.map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold uppercase tracking-normal text-white">{title}</h2>
      <ul className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <li key={href + label}>
            <Link href={href} className="block text-sm leading-6 text-slate-300 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
