export default function Loading() {
  return (
    <main className="page-shell gap-8 sm:pt-12">
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="h-9 w-3/4 max-w-md animate-pulse rounded-xl bg-muted" />
        <div className="h-20 w-full animate-pulse rounded-2xl bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-3xl bg-muted/80" />
        ))}
      </div>
    </main>
  );
}
