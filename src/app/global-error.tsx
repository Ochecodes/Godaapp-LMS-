"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[Application] Unhandled rendering error.", error.digest ?? "No error digest available.");
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-background px-5 py-16 text-foreground">
        <main className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold tracking-tight">We hit an unexpected error</h1>
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
        </main>
      </body>
    </html>
  );
}
