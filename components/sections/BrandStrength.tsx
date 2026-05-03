const strengths = [
  ["Sarah J.", "Verified Buyer", "The quality is outstanding. Pieces fit perfectly and the models are so detailed."],
  ["Michael T.", "Verified Buyer", "Great sets for both kids and adults. The technic series is my favorite."],
  ["David L.", "Retail Partner", "Reliable partner for our retail business. Excellent support and fast delivery."],
];

export function BrandStrength() {
  return (
    <section className="bg-[#f6f7f9] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950">What Builders Say</h2>
          <span className="text-sm font-bold text-slate-500">View all reviews</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {strengths.map(([name, role, quote]) => (
            <article key={name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-sm font-black text-red-600">
                  {name.slice(0, 1)}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-950">{name}</h3>
                  <p className="text-xs font-semibold text-slate-500">{role}</p>
                </div>
              </div>
              <p className="mt-4 text-yellow-400">★★★★★</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{quote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
