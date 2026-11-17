"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function FrontendError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[Frontend] Page failed to load.", error.digest ?? "No error digest available.");
  }, [error]);

  return (
    <main className="grid min-h-[65vh] place-items-center px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-destructive">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-muted-foreground">
          Please try again. If the problem continues, contact support.
        </p>
        <button
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
