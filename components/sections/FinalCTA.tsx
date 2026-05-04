import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

export function FinalCTA() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/20 lg:grid-cols-[1fr_0.52fr]">
        <div className="relative z-10 px-6 py-10 sm:px-10">
          <h2 className="max-w-2xl text-3xl font-black tracking-normal sm:text-4xl">Ready to Build Something Amazing?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
            Explore our latest sets or become a partner today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/products" variant="dark" className="min-w-36">
              Shop Now
            </LinkButton>
            <Link
              href="/custom-solutions"
              className="inline-flex min-h-11 min-w-40 items-center justify-center rounded-md border border-white bg-red-600 px-6 py-3 text-sm font-bold text-white transition duration-200 hover:border-white hover:bg-white hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Partner With Us
            </Link>
          </div>
        </div>
        <div className="relative hidden min-h-48 overflow-hidden bg-red-700 lg:block">
          <Image
            src="https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80"
            alt="Display model for JIESTAR building block products"
            fill
            sizes="30vw"
            className="object-cover object-center opacity-95"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#dc2626_0%,rgba(220,38,38,.5)_42%,rgba(220,38,38,.1)_100%)]" />
        </div>
      </div>
    </section>
  );
}
