"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

type CheckoutPanelProps = {
  courseTitle: string;
  courseSlug: string;
  priceUSD: number;
};

export function CheckoutPanel({ courseTitle, courseSlug, priceUSD }: CheckoutPanelProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function payWithPaystack() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: courseSlug }),
      });
      const result = (await response.json()) as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) {
        throw new Error(result.error ?? "Checkout could not be started.");
      }
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/catalog">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to catalog
        </Link>
        <section className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-primary">Secure checkout</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Complete your enrollment</h1>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-lg bg-muted/60 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Course</p>
              <h2 className="mt-1 font-semibold">{courseTitle}</h2>
            </div>
            <p className="text-lg font-bold">${priceUSD.toFixed(2)} USD</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Your enrollment will activate once Paystack confirms the payment. You’ll return to your student dashboard afterward.
          </p>
          <button
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={loading}
            onClick={() => void payWithPaystack()}
            type="button"
          >
            {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            Pay with Paystack
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Payment details are securely handled by Paystack.
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Crypto payments are not available yet.
          </p>
          {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
        </section>
      </div>
    </main>
  );
}
