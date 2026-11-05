export default function AppLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="h-8 w-48 animate-pulse rounded-2xl bg-muted" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded-xl bg-muted/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-muted/70" />
    </main>
  );
}
