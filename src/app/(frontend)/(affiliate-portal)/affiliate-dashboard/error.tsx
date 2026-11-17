"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function AffiliateDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(
      "[Affiliate dashboard] Page failed to load.",
      error.digest ?? "No error digest available.",
    );
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[50vh] max-w-lg place-items-center px-5 py-12 text-center">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">We couldn&apos;t load this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your account data wasn&apos;t available. Try again to reload; if you just
          submitted a request, check its history before submitting it again.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
