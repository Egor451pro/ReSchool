export default function Loading() {
  return (
    <main className="page-shell gap-8 sm:pt-12">
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="h-9 w-3/4 max-w-md animate-pulse rounded-xl bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-2xl bg-muted/70" />
      </div>
      <div className="h-72 animate-pulse rounded-[2rem] border border-line bg-muted/50" />
      <div className="h-48 animate-pulse rounded-[2rem] border border-dashed border-line bg-muted/30" />
    </main>
  );
}
