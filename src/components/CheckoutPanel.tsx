"use client";

import Link from "next/link";
import Script from "next/script";
import { useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

type BachsCheckoutEvent = {
  type: string;
  data?: { message?: string };
};

type BachsCheckoutSdk = {
  Initialize: (options?: Record<string, never>) => unknown;
  Checkout: {
    open: (args: {
      checkoutUrl: string;
      onEvent: (event: BachsCheckoutEvent) => void;
      options?: { autoCloseOnComplete?: boolean };
    }) => Promise<void>;
  };
};

declare global {
  interface Window {
    Bachs?: BachsCheckoutSdk;
  }
}

type CheckoutPanelProps = {
  courseTitle: string;
  courseSlug: string;
  priceUSD: number;
};

export function CheckoutPanel({ courseTitle, courseSlug, priceUSD }: CheckoutPanelProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bachsReady, setBachsReady] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const initialized = useRef(false);

  function initializeBachs() {
    if (!window.Bachs) {
      setError("Bachs checkout could not be loaded. Please refresh and try again.");
      return;
    }
    if (!initialized.current) {
      window.Bachs.Initialize();
      initialized.current = true;
    }
    setBachsReady(true);
  }

  async function payWithBachs() {
    setError("");
    setPaymentStatus("");
    setLoading(true);
    try {
      const response = await fetch("/api/payments/bachs/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: courseSlug }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error ?? "Checkout could not be started.");
      }
      if (!window.Bachs) throw new Error("Bachs checkout is not ready. Please refresh and try again.");

      await window.Bachs.Checkout.open({
        checkoutUrl: result.checkoutUrl,
        options: { autoCloseOnComplete: false },
        onEvent: (event) => {
          if (event.type === "checkout.completed") {
            setPaymentStatus("Payment received. Your enrollment will activate after server confirmation.");
          } else if (event.type === "checkout.failed") {
            setError("Payment was not completed. You can try again.");
          } else if (event.type === "checkout.expired") {
            setError("This checkout expired. Start a new checkout to continue.");
          } else if (event.type === "checkout.closed") {
            setLoading(false);
          } else if (event.type === "checkout.error") {
            console.error("[Bachs checkout] Overlay error:", event.data?.message ?? "Unknown SDK error.");
            setError("Bachs checkout could not be opened. Please try again.");
          }
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be started.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.bachs.io/bachs.js"
        strategy="afterInteractive"
        onError={() => setError("Bachs checkout could not be loaded. Please refresh and try again.")}
        onReady={initializeBachs}
      />
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
              Choose a supported fiat currency or cryptocurrency and payment method in the secure Bachs checkout.
              Your enrollment activates after Bachs confirms payment to our server.
            </p>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Bachs shows the available fiat currencies when adaptive pricing is enabled for your account. The
              overlay also lists the payment methods and crypto assets enabled for your Bachs account.
            </p>
            <button
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={loading || !bachsReady}
              onClick={() => void payWithBachs()}
              type="button"
            >
              {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {bachsReady ? "Continue to secure checkout" : "Loading secure checkout…"}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Payment details are securely handled by Bachs.
            </div>
            {paymentStatus && <p className="mt-4 text-sm text-center text-primary" role="status">{paymentStatus}</p>}
            {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
          </section>
        </div>
      </main>
    </>
  );
}
