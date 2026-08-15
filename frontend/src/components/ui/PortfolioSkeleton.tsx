/**
 * Skeleton placeholder for the portfolio grid.
 * Renders the same responsive grid + aspect-video cards as PortfolioSection
 * so no layout shift occurs while data loads.
 */
export default function PortfolioSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <article
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-border"
          aria-hidden="true"
        >
          <div className="aspect-video bg-border/50" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 rounded bg-border/50" />
            <div className="h-3 w-1/4 rounded bg-border/50" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-border/50" />
              <div className="h-3 w-2/3 rounded bg-border/50" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
