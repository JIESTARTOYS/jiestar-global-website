function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export default function ProductDetailLoading() {
  return (
    <div className="bg-white px-5 py-8 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex gap-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-4 w-36" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.98fr)] lg:items-start">
          <div className="grid gap-4">
            <div className="aspect-square rounded-lg border border-slate-200 bg-slate-100" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
              ))}
            </div>
          </div>

          <div>
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-12 w-3/4" />
            <SkeletonBlock className="mt-5 h-8 w-28" />
            <div className="mt-6 grid gap-3">
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-5/6" />
              <SkeletonBlock className="h-5 w-2/3" />
            </div>
            <SkeletonBlock className="mt-6 h-52 w-full" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-28" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
