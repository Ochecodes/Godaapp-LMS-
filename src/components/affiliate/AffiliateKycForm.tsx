"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LoaderCircle, ShieldCheck } from "lucide-react";
import { submitAffiliateKyc, type KycActionState } from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";
import { AffiliateStatusBadge } from "./AffiliatePortalUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type KycFormValues = {
  status: string;
  legalName: string;
  dateOfBirth: string;
  country: string;
  residentialAddress: string;
  identityType: string;
  identityLastFour: string;
  reviewNotes: string;
};

const initialState: KycActionState = {};

export function AffiliateKycForm({ values }: { values: KycFormValues }) {
  const [state, formAction, pending] = useActionState(submitAffiliateKyc, initialState);
  const router = useRouter();
  const verified = values.status === "verified";

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {verified ? <BadgeCheck aria-hidden="true" className="size-5" /> : <ShieldCheck aria-hidden="true" className="size-5" />}
          </span>
          <div>
            <h2 className="font-semibold">Identity review</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Identity verification is required before requesting a payout.
            </p>
          </div>
        </div>
        <AffiliateStatusBadge status={values.status.replace(/_/g, " ")} />
      </section>

      {values.reviewNotes && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold">Additional information requested</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{values.reviewNotes}</p>
        </div>
      )}

      {state.success && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary" role="status">
          {state.success}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold">Verification details</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Provide accurate details for the GodaApp super-admin team to review.
            Do not enter a full identity number or upload documents here.
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              Legal name
              <Input
                autoComplete="name"
                className="min-h-10"
                defaultValue={values.legalName}
                maxLength={120}
                name="legalName"
                required
                readOnly={verified}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Date of birth
              <Input
                className="min-h-10"
                defaultValue={values.dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                name="dateOfBirth"
                required
                type="date"
                readOnly={verified}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Country
              <Input
                autoComplete="country-name"
                className="min-h-10"
                defaultValue={values.country}
                maxLength={100}
                name="country"
                required
                readOnly={verified}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Identity document type
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                defaultValue={values.identityType}
                disabled={verified}
                name="identityType"
                required
              >
                <option value="passport">Passport</option>
                <option value="national_id">National identity card</option>
                <option value="drivers_license">Driver&apos;s license</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Last four digits of identity number
              <Input
                autoComplete="off"
                className="min-h-10 max-w-48"
                defaultValue={values.identityLastFour}
                inputMode="numeric"
                maxLength={4}
                minLength={4}
                name="identityLastFour"
                pattern="[0-9]{4}"
                placeholder="0000"
                required
                readOnly={verified}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Residential address
            <textarea
              className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              defaultValue={values.residentialAddress}
              maxLength={500}
              name="residentialAddress"
              required
              readOnly={verified}
            />
          </label>
          {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          {!verified && (
            <Button disabled={pending} type="submit">
              {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
              Submit for review
            </Button>
          )}
        </form>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        KYC information is stored in the restricted Payload admin collection and
        is available only to authorized GodaApp super-admins. GodaApp does not
        request bank details or full identity-document numbers on this form.
      </p>
    </div>
  );
}
