"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

type AffiliateReferralLinkProps = {
  active?: boolean;
  compact?: boolean;
  referralCode: string;
};

function createReferralLink(referralCode: string): string {
  const link = new URL("/api/affiliate/referral", window.location.origin);
  link.searchParams.set("code", referralCode);
  link.searchParams.set("next", "/catalog");
  return link.toString();
}

export function AffiliateReferralLink({
  active = true,
  compact = false,
  referralCode,
}: AffiliateReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [manualLink, setManualLink] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(createReferralLink(referralCode));
      setCopyError("");
      setManualLink("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setManualLink(createReferralLink(referralCode));
      setCopyError("Copy is unavailable. Select and copy the referral link above.");
    }
  }

  if (!active && compact) {
    return (
      <span className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground">
        Link inactive
      </span>
    );
  }

  if (!active) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold">No active referral link</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Create a new link to start attributing eligible paid course enrollments.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          aria-label={copied ? "Referral link copied" : "Copy referral link"}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => void copyLink()}
          type="button"
        >
          {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy referral link"}</span>
        </button>
        {copyError && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] space-y-2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <p className="text-xs text-destructive" role="alert">{copyError}</p>
            <input
              aria-label="Referral link to copy manually"
              className="min-h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-xs text-foreground"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={manualLink}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">Your active referral link</p>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
        /api/affiliate/referral?code={encodeURIComponent(referralCode)}&amp;next=%2Fcatalog
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => void copyLink()}
          type="button"
        >
          {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={`/api/affiliate/referral?code=${encodeURIComponent(referralCode)}&next=%2Fcatalog`}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          Open link
        </a>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Referral link copied to clipboard." : copyError}
      </p>
      {copyError && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-destructive" role="alert">Copy is unavailable. Select and copy the link below.</p>
          <input
            aria-label="Referral link to copy manually"
            className="min-h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-xs text-foreground"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={manualLink}
          />
        </div>
      )}
    </div>
  );
}
