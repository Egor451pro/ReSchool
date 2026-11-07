export default function Loading() {
  return (
    <main className="page-shell gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-8 w-48 max-w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex h-44 flex-col gap-3 rounded-3xl border border-line bg-surface p-4"
          >
            <div className="h-24 animate-pulse rounded-2xl bg-muted/80" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted/50" />
          </div>
        ))}
      </div>
    </main>
  );
}
