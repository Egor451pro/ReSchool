export default function RootLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="h-10 w-3/4 max-w-md animate-pulse rounded-2xl bg-muted" />
        <div className="h-5 w-full animate-pulse rounded-xl bg-muted/80" />
        <div className="h-5 w-5/6 animate-pulse rounded-xl bg-muted/70" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
      </div>
    </main>
  );
}
