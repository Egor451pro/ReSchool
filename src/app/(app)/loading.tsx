export default function Loading() {
  return (
    <main className="page-shell gap-6">
      <div className="h-8 w-48 max-w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-3xl bg-muted/80" />
        ))}
      </div>
    </main>
  );
}
