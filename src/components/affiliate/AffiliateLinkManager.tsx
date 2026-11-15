"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, LoaderCircle, RotateCw } from "lucide-react";
import {
  deactivateAffiliateReferralLink,
  rotateAffiliateReferralLink,
} from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";
import { AffiliateReferralLink } from "./AffiliateReferralLink";
import { Button } from "@/components/ui/button";

export function AffiliateLinkManager({
  initialCode,
  initialActive,
}: {
  initialCode: string;
  initialActive: boolean;
}) {
  const [referralCode, setReferralCode] = useState(initialCode);
  const [active, setActive] = useState(initialActive);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function createLink() {
    if (
      active &&
      !window.confirm(
        "Creating a new link immediately invalidates your current link. Existing referral records remain unchanged. Continue?",
      )
    ) {
      return;
    }

    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await rotateAffiliateReferralLink();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.referralCode) setReferralCode(result.referralCode);
      setActive(true);
      setMessage(result.success ?? "A new referral link is ready.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A referral link could not be created.");
    } finally {
      setPending(false);
    }
  }

  async function deactivateLink() {
    if (
      !window.confirm(
        "Deactivate this link? New visits will no longer be attributed to your account.",
      )
    ) {
      return;
    }

    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await deactivateAffiliateReferralLink();
      if (result.error) {
        setError(result.error);
        return;
      }
      setActive(false);
      setMessage(result.success ?? "Your referral link was deactivated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The referral link could not be deactivated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Link2 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Your active catalog link</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Use this link to share GodaApp courses. A referral is recorded only
                after the visitor completes a verified paid checkout.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button disabled={pending} onClick={createLink} type="button" variant="outline">
              {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <RotateCw aria-hidden="true" />}
              {active ? "Create new link" : "Create link"}
            </Button>
            {active && (
              <Button
                disabled={pending}
                onClick={deactivateLink}
                type="button"
                variant="destructive"
              >
                <Link2Off aria-hidden="true" />
                Deactivate
              </Button>
            )}
          </div>
        </div>

        <AffiliateReferralLink active={active} referralCode={referralCode} />
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          You can have one active link at a time. Replacing or deactivating a link
          affects new attribution only; existing referral credits remain in your ledger.
        </p>
        {message && (
          <p className="mt-3 text-sm text-primary" role="status">{message}</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
        <h2 className="font-semibold">Attribution rule</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          GodaApp uses a 30-day cookie and last valid link wins. A new approved,
          active affiliate link replaces the prior valid attribution. Invalid or
          deactivated links cannot overwrite it or create a commission.
        </p>
      </section>
    </div>
  );
}
