type RouteSkeletonVariant = "site" | "content" | "auth" | "dashboard";

type RouteSkeletonProps = {
  label?: string;
  variant?: RouteSkeletonVariant;
};

const pulse = "animate-pulse motion-reduce:animate-none rounded-xl bg-muted";

function SkeletonLines({ count = 2 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          className={`${pulse} h-3 ${index === count - 1 ? "w-2/3" : "w-full"}`}
          key={index}
        />
      ))}
    </div>
  );
}

export function RouteSkeleton({
  label = "Loading page",
  variant = "content",
}: RouteSkeletonProps) {
  return (
    <main
      aria-busy="true"
      aria-label={label}
      className="min-h-[60vh] bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {variant === "auth" ? (
        <div aria-hidden="true" className="mx-auto grid min-h-[70vh] max-w-6xl overflow-hidden rounded-2xl border border-border lg:grid-cols-2">
          <div className={`${pulse} hidden min-h-[34rem] rounded-none lg:block`} />
          <div className="space-y-6 p-6 sm:p-10">
            <div className={`${pulse} h-4 w-28`} />
            <div className={`${pulse} h-10 w-3/4`} />
            <div className={`${pulse} h-11 w-full`} />
            <div className={`${pulse} h-11 w-full`} />
            <div className={`${pulse} h-11 w-full`} />
            <div className={`${pulse} h-12 w-full`} />
          </div>
        </div>
      ) : variant === "dashboard" ? (
        <div aria-hidden="true" className="mx-auto w-full max-w-7xl space-y-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="w-full max-w-xl space-y-3">
              <div className={`${pulse} h-3 w-24`} />
              <div className={`${pulse} h-8 w-2/3`} />
            </div>
            <div className={`${pulse} size-11 shrink-0 rounded-full`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div className={`${pulse} h-36`} key={index} />
            ))}
          </div>
          <div className={`${pulse} h-64`} />
        </div>
      ) : variant === "site" ? (
        <div aria-hidden="true" className="mx-auto max-w-7xl space-y-8 py-4">
          <div className="flex items-center justify-between">
            <div className={`${pulse} h-10 w-40`} />
            <div className={`${pulse} h-10 w-32`} />
          </div>
          <div className="space-y-5 py-12 text-center sm:py-20">
            <div className={`${pulse} mx-auto h-12 w-3/4 max-w-2xl`} />
            <div className={`${pulse} mx-auto h-4 w-2/3 max-w-xl`} />
            <div className={`${pulse} mx-auto h-11 w-36`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div className={`${pulse} h-44`} key={index} />
            ))}
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="mx-auto w-full max-w-7xl space-y-6 py-4">
          <div className={`${pulse} h-10 w-2/3 max-w-md`} />
          <SkeletonLines />
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div className={`${pulse} h-36`} key={index} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
