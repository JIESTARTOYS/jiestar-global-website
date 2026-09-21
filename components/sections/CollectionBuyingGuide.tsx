import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import type { CollectionBuyingContent } from "@/lib/collection-content";

export function CollectionBuyingGuide({ content }: { content: CollectionBuyingContent }) {
  return (
    <section id="buying-guide" aria-labelledby="buying-guide-title" className="mt-8 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6 lg:p-8">
      <p className="text-sm font-black uppercase text-red-600">Collection buying guide</p>
      <h2 id="buying-guide-title" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{content.guideTitle}</h2>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {content.selection.map((item) => (
          <article key={item.title} className="rounded-lg bg-slate-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-black text-slate-950">{content.wholesaleTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{content.wholesale}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/wholesale" className="px-4">Request wholesale details</LinkButton>
            <LinkButton href="/custom-solutions" variant="secondary" className="px-4">Discuss a custom project</LinkButton>
          </div>
          <h3 className="mt-6 text-base font-bold text-slate-950">Explore models and planning guides</h3>
          <ul className="mt-3 grid gap-3">
            {content.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-semibold leading-6 text-red-700 underline underline-offset-4 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-950">Questions before ordering</h2>
          {content.questions.map((item) => (
            <div key={item.question} className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="text-base font-bold text-slate-950">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
