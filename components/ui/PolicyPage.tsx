import Link from "next/link";
import type { ReactNode } from "react";
import { BusinessIdentity } from "@/components/ui/BusinessIdentity";

type PolicySection = {
  title: string;
  body?: string;
  items?: string[];
};

type PolicyNote = {
  title: string;
  body: string;
};

type PolicyPageProps = {
  title: string;
  description: string;
  updatedLabel?: string;
  sections: PolicySection[];
  note?: PolicyNote;
  ctaLabel?: string;
  children?: ReactNode;
};

export function PolicyPage({
  title,
  description,
  updatedLabel = "Updated for JIESTAR global website launch",
  sections,
  note,
  ctaLabel = "Contact JIESTAR",
  children,
}: PolicyPageProps) {
  return (
    <div className="bg-white px-5 py-14 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold text-red-600">{updatedLabel}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
        </div>

        <div className="divide-y divide-slate-200">
          {sections.map((section) => (
            <section key={section.title} className="py-8">
              <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{section.title}</h2>
              {section.body ? <p className="mt-4 text-base leading-8 text-slate-600">{section.body}</p> : null}
              {section.items?.length ? (
                <ul className="mt-5 grid gap-3 text-base leading-7 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <BusinessIdentity className="mb-8" />

        {note ? (
          <aside className="rounded-lg border border-red-100 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-slate-950">{note.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">{note.body}</p>
          </aside>
        ) : null}

        {children ? <div className="mt-10">{children}</div> : null}

        <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Need help?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Contact JIESTAR support or business team for order questions, missing piece support, wholesale supply, or
            custom product development.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
