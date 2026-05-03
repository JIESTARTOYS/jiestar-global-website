import Link from "next/link";

export function PolicyPage({ title, sections }: { title: string; sections: string[] }) {
  return (
    <div className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <div className="mt-8 space-y-5 text-base leading-8 text-slate-600">
          {sections.map((section) => (
            <p key={section}>{section}</p>
          ))}
        </div>
        <div className="mt-10 rounded-lg bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Need help?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Contact JIESTAR support or business team for order, wholesale, or custom project questions.
          </p>
          <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-slate-950 underline">
            Contact JIESTAR
          </Link>
        </div>
      </div>
    </div>
  );
}
