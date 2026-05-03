import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";

export function FinalCTA() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/20 lg:grid-cols-[1fr_0.5fr]">
        <div className="px-6 py-10 sm:px-10">
          <h2 className="max-w-2xl text-3xl font-black tracking-normal sm:text-4xl">Ready to Build Something Amazing?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
            Explore our latest sets or become a partner today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/products" variant="dark" className="min-w-36">
              Shop Now
            </LinkButton>
            <LinkButton href="/custom-solutions" variant="secondary" className="min-w-40 border-white/50 bg-transparent text-white hover:bg-white/10">
              Partner With Us
            </LinkButton>
          </div>
        </div>
        <div className="relative hidden min-h-48 lg:block">
          <Image
            src="https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80"
            alt="Display model for JIESTAR building block products"
            fill
            sizes="30vw"
            className="object-cover mix-blend-screen opacity-80"
          />
        </div>
      </div>
    </section>
  );
}
