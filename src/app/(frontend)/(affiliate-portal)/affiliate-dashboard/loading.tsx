export default function AffiliateDashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading affiliate workspace" className="space-y-7">
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-32 animate-pulse rounded-xl border border-border bg-card" key={index} />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}
