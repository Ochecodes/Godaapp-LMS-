"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Banknote, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestAffiliateWithdrawal,
  type AffiliateActionState,
} from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";
import { formatAffiliateCurrency } from "./AffiliatePortalUI";

const initialState: AffiliateActionState = {};

type PayoutReviewDetails = {
  payoutMethod: "bank_transfer" | "usdt_trc20";
  accountName: string;
  country: string;
  bankName: string;
  accountNumber: string;
  walletAddress: string;
};

export function AffiliatePayoutRequestDialog({
  availableBalance,
}: {
  availableBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<"bank_transfer" | "usdt_trc20">("bank_transfer");
  const [reviewDetails, setReviewDetails] = useState<PayoutReviewDetails | null>(null);
  const [state, formAction, pending] = useActionState(
    requestAffiliateWithdrawal,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setStep(0);
      setReviewDetails(null);
      router.refresh();
    }
  }, [router, state.success]);

  function continueToReview() {
    const form = formRef.current;
    if (!form?.reportValidity()) return;
    const values = new FormData(form);
    setReviewDetails({
      payoutMethod: method,
      accountName: String(values.get("accountName") ?? ""),
      country: String(values.get("country") ?? ""),
      bankName: String(values.get("bankName") ?? ""),
      accountNumber: String(values.get("accountNumber") ?? ""),
      walletAddress: String(values.get("walletAddress") ?? ""),
    });
    setStep(1);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button">
        <Banknote aria-hidden="true" />
        Request payout
      </Button>
      {state.success && (
        <p className="mt-2 text-sm text-primary" role="status">
          {state.success}
        </p>
      )}
      <Dialog
        onOpenChange={(nextOpen) => {
          if (!pending) {
            setOpen(nextOpen);
            if (!nextOpen) {
              setStep(0);
              setReviewDetails(null);
            }
          }
        }}
        open={open}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Offline payout request · Step {step + 1} of 2
            </p>
            <DialogTitle>Request a payout</DialogTitle>
            <DialogDescription>
              Your available balance is reserved when you submit. Godaapp staff
              review and complete payouts manually outside the app.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-5" ref={formRef}>
            <input
              name="expectedAvailableBalance"
              type="hidden"
              value={availableBalance.toFixed(2)}
            />
            <div className={step === 0 ? "space-y-4" : "hidden"}>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Available to request</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatAffiliateCurrency(availableBalance)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The server will reserve your eligible referral credits and calculate the final amount.
                  </p>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Payout method</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5">
                      <input
                        checked={method === "bank_transfer"}
                        className="accent-primary"
                        name="payoutMethod"
                        onChange={() => setMethod("bank_transfer")}
                        type="radio"
                        value="bank_transfer"
                      />
                      Bank transfer
                    </label>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5">
                      <input
                        checked={method === "usdt_trc20"}
                        className="accent-primary"
                        name="payoutMethod"
                        onChange={() => setMethod("usdt_trc20")}
                        type="radio"
                        value="usdt_trc20"
                      />
                      USDT · TRC-20
                    </label>
                  </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium">
                    Account holder name
                    <Input autoComplete="name" className="min-h-10" maxLength={120} name="accountName" required />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Country
                    <Input autoComplete="country-name" className="min-h-10" maxLength={100} name="country" required />
                  </label>
                </div>

                {method === "bank_transfer" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      Bank name
                      <Input className="min-h-10" maxLength={120} name="bankName" required />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium">
                      Account number
                      <Input autoComplete="off" className="min-h-10" maxLength={80} name="accountNumber" required />
                    </label>
                  </div>
                ) : (
                  <label className="block space-y-1.5 text-sm font-medium">
                    USDT wallet address
                    <Input
                      autoComplete="off"
                      className="min-h-10"
                      maxLength={160}
                      name="walletAddress"
                      pattern="T[1-9A-HJ-NP-Za-km-z]{33}"
                      placeholder="TRC-20 address beginning with T"
                      required
                    />
                    <span className="block text-xs font-normal text-muted-foreground">
                      Confirm that this is a TRC-20 address before submitting.
                    </span>
                  </label>
                )}
            </div>
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Requested amount</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatAffiliateCurrency(availableBalance)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 text-sm">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Method</dt>
                      <dd className="mt-1 font-medium">
                        {method === "bank_transfer" ? "Bank transfer" : "USDT (TRC-20)"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Account holder</dt>
                      <dd className="mt-1 font-medium">{reviewDetails?.accountName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Country</dt>
                      <dd className="mt-1 font-medium">{reviewDetails?.country}</dd>
                    </div>
                    {method === "bank_transfer" ? (
                      <>
                        <div>
                          <dt className="text-xs text-muted-foreground">Bank</dt>
                          <dd className="mt-1 font-medium">{reviewDetails?.bankName}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Account number</dt>
                          <dd className="mt-1 font-medium">
                            Ending in {reviewDetails?.accountNumber.slice(-4)}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted-foreground">TRC-20 wallet address</dt>
                        <dd className="mt-1 break-all font-mono text-xs font-medium">
                          {reviewDetails?.walletAddress}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-2 text-muted-foreground">
                    Review the details you entered. Referral credits are reserved
                    after submission and restored if staff reject the request.
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This creates a request for manual processing. No bank transfer,
                  crypto transaction, or payment-provider action is started by submitting.
                </p>
                <label className="flex items-start gap-2 text-sm leading-relaxed">
                  <input
                    className="mt-1 accent-primary"
                    name="confirmDetails"
                    required
                    type="checkbox"
                    value="yes"
                  />
                  <span>I confirm these payout details are accurate and belong to me.</span>
                </label>
              </div>
            )}

            {state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}

            <DialogFooter>
              {step === 1 ? (
                <Button
                  onClick={() => setStep(0)}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <Button
                  disabled={pending}
                  onClick={() => {
                    setOpen(false);
                    setStep(0);
                    setReviewDetails(null);
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
              {step === 0 ? (
                <Button onClick={continueToReview} type="button">
                  Review request
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button disabled={pending} type="submit">
                  {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
                  Submit request
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
