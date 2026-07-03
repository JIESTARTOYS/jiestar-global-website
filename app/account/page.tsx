import Link from "next/link";
import { ArrowRightIcon, PackageIcon, RotateIcon, ShieldIcon, StoreIcon, UserIcon } from "@/components/ui/Icons";
import { getCustomerAccountUrl } from "@/lib/account";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Account | JIESTAR Toys",
  description:
    "Manage your JIESTAR customer account through Shopify for orders, profile details, saved addresses, and checkout-related account support.",
  path: "/account",
});

const accountBenefits = [
  {
    title: "Order history",
    text: "View retail orders placed through Shopify checkout and follow order status from your customer account.",
    icon: PackageIcon,
  },
  {
    title: "Profile and addresses",
    text: "Manage account details and saved shipping information through Shopify's secure customer account experience.",
    icon: UserIcon,
  },
  {
    title: "Returns and support",
    text: "Use account and policy links to understand returns, refund handling, and support options for retail purchases.",
    icon: RotateIcon,
  },
];

const supportLinks = [
  {
    title: "Replacement parts",
    text: "Request help when a building block set has a missing, incorrect, damaged, or lost piece.",
    href: "/support/replacement-parts",
    icon: ShieldIcon,
  },
  {
    title: "Shipping policy",
    text: "Review how retail shipping information and delivery updates are handled.",
    href: "/policies/shipping-policy",
    icon: PackageIcon,
  },
  {
    title: "Returns and refunds",
    text: "Review return and refund guidance for retail orders.",
    href: "/policies/refund-policy",
    icon: RotateIcon,
  },
];

export default function AccountPage() {
  const accountUrl = getCustomerAccountUrl();

  return (
    <div className="bg-[#f7f8fa] px-4 py-8 sm:px-5 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div>
            <p className="text-sm font-black uppercase text-red-600">Customer account</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Manage your JIESTAR account.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Sign in through Shopify to access retail order history, profile details, saved addresses, and checkout-related account tools in a secure customer account experience.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {accountUrl ? (
                <a
                  href={accountUrl}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Sign in with Shopify
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Contact support
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              )}
              {accountUrl && (
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Contact support
                </Link>
              )}
            </div>

            {!accountUrl && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Customer account sign-in is unavailable right now. Contact JIESTAR support for order or account help.
              </p>
            )}
          </div>

          <div className="grid gap-3">
            {accountBenefits.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-red-600 shadow-sm shadow-slate-950/[0.04]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {supportLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <span className="mt-4 inline-flex items-center text-sm font-black text-red-600 transition group-hover:text-red-700">
                  View details
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </section>

        <section className="mt-8 grid gap-5 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
              <StoreIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black uppercase text-red-300">Business cooperation</p>
              <h2 className="mt-2 text-xl font-black">Wholesale and custom projects are handled separately.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Retail customer accounts are for DTC orders and account support. For wholesale supply, OEM / ODM, product co-development, exclusive SKUs, or sub-brand cooperation, use the business inquiry paths.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/wholesale"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Wholesale
            </Link>
            <Link
              href="/custom-solutions"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Custom Solutions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
