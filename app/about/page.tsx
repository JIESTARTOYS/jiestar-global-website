import Image from "next/image";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About JIESTAR",
  description:
    "Learn about JIESTAR, founded in 1998, and its building block product development, production, sales, and global cooperation capabilities.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="About JIESTAR"
          description="JIESTAR is positioned as an international building block brand with factory supply capability, product development capability, custom cooperation capability, and global market support."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-base leading-8 text-slate-600">
            <p>
              Founded in 1998, Guangdong Jiexing Toys Industrial Co., Ltd. has developed into an integrated toy company combining product development, production, and sales.
            </p>
            <p>
              Through continuous innovation and long-term cooperation with global partners, JIESTAR creates building block products with engaging building experiences, display value, and market potential.
            </p>
            <p>
              The global website supports DTC customers, wholesale buyers, OEM / ODM customization, product co-development, exclusive product lines, and sub-brand partnerships.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
            <Image
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
              alt="Modern office and product development workspace"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/custom-solutions">Learn More About Cooperation</LinkButton>
          <LinkButton href="/contact" variant="secondary">Contact Us</LinkButton>
        </div>
      </div>
    </div>
  );
}
