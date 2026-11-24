import { Download, ReceiptText } from "lucide-react";
import { getAffiliatePayoutPageData } from "../actions";
import {
  AffiliateEmptyState,
  AffiliateMetricCard,
  AffiliatePageHeader,
  AffiliateStatusBadge,
  formatAffiliateCurrency,
  formatAffiliateDate,
} from "@/components/affiliate/AffiliatePortalUI";
import { Button } from "@/components/ui/button";

function payoutStatusLabel(status: string) {
  if (status === "approved") return "Paid offline";
  if (status === "rejected") return "Rejected";
  return "In review";
}

function payoutMethodLabel(method: string | null) {
  if (method === "bank_transfer") return "Bank transfer";
  if (method === "usdt_trc20") return "USDT · TRC-20";
  return "Legacy request";
}

export default async function AffiliatePayoutsPage() {
  const { payouts, adjustments } = await getAffiliatePayoutPageData();
  const paidTotal = payouts
    .filter((payout) => payout.status === "approved")
    .reduce((sum, payout) => sum + payout.amountUSD, 0);
  const pendingTotal = payouts
    .filter((payout) => payout.status === "pending")
    .reduce((sum, payout) => sum + payout.amountUSD, 0);
  const credits = payouts.flatMap((payout) =>
    payout.referrals.map((referral) => ({
      ...referral,
      payoutId: payout.id,
    })),
  );

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="Payouts history"
        description="Track offline payout requests and the referral credits reserved or settled by each request."
        actions={
          <Button asChild variant="outline">
            <a href="/api/affiliate/payouts/export">
              <Download aria-hidden="true" />
              Export CSV
            </a>
          </Button>
        }
      />

      <section aria-label="Payout totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AffiliateMetricCard
          detail="Requests marked paid after offline processing"
          icon={ReceiptText}
          label="Paid offline"
          tone="green"
          value={formatAffiliateCurrency(paidTotal)}
        />
        <AffiliateMetricCard
          detail="Requests currently awaiting an admin decision"
          icon={ReceiptText}
          label="In review"
          tone="orange"
          value={formatAffiliateCurrency(pendingTotal)}
        />
        <AffiliateMetricCard
          detail="Refund and chargeback offsets applied to future commissions"
          icon={ReceiptText}
          label="Outstanding adjustments"
          tone="orange"
          value={formatAffiliateCurrency(
            adjustments
              .filter((adjustment) => adjustment.status === "unapplied")
              .reduce((sum, adjustment) => sum + adjustment.amountUSD, 0),
          )}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="font-semibold">Commission adjustments</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Refunds and chargebacks are recorded by a super admin. Offsets reduce a future payout.
          </p>
        </div>
        {adjustments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 text-right font-medium">Amount (USD)</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatAffiliateDate(adjustment.createdAt)}</td>
                    <td className="px-5 py-4 font-medium capitalize">{adjustment.reason.replace(/_/g, " ")}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">{formatAffiliateCurrency(adjustment.amountUSD)}</td>
                    <td className="max-w-48 truncate px-5 py-4 text-muted-foreground">{adjustment.reference || "—"}</td>
                    <td className="px-5 py-4"><AffiliateStatusBadge status={adjustment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <AffiliateEmptyState
              description="Any admin-entered refund or chargeback adjustment will be listed here."
              title="No adjustments"
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="font-semibold">Payout requests</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each request is reviewed and processed manually by Godaapp staff.</p>
        </div>
        {payouts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Request</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 text-right font-medium">Amount (USD)</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Payment reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">Payout #{payout.id}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatAffiliateDate(payout.createdAt)}
                      {payout.paidAt && (
                        <span className="mt-1 block text-xs">Paid {formatAffiliateDate(payout.paidAt)}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{payoutMethodLabel(payout.payoutMethod)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">{formatAffiliateCurrency(payout.amountUSD)}</td>
                    <td className="px-5 py-4">
                      <AffiliateStatusBadge status={payoutStatusLabel(payout.status)} />
                      {payout.rejectionReason && (
                        <span className="mt-1 block max-w-48 text-xs text-muted-foreground">
                          {payout.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="max-w-56 truncate px-5 py-4 text-muted-foreground">{payout.transactionReference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <AffiliateEmptyState
              description="When you request a payout, its review status and any offline payment reference will be listed here."
              title="No payout requests yet"
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="font-semibold">Referral credits in payout requests</h2>
          <p className="mt-1 text-xs text-muted-foreground">A reserved credit returns to Balance if staff reject its request.</p>
        </div>
        {credits.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Purchaser</th>
                  <th className="px-5 py-3 text-right font-medium">Commission (USD)</th>
                  <th className="px-5 py-3 font-medium">Payout request</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {credits.map((credit) => (
                  <tr key={`${credit.payoutId}-${credit.id}`}>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatAffiliateDate(credit.createdAt)}</td>
                    <td className="max-w-56 truncate px-5 py-4 font-medium">{credit.course}</td>
                    <td className="px-5 py-4 text-muted-foreground">{credit.purchaser}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">{formatAffiliateCurrency(credit.commissionUSD)}</td>
                    <td className="whitespace-nowrap px-5 py-4">#{credit.payoutId}</td>
                    <td className="px-5 py-4"><AffiliateStatusBadge status={credit.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <AffiliateEmptyState
              description="Referral credits move here when they are reserved for a payout request."
              title="No credits have been allocated"
            />
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        A completed request means an administrator recorded an offline payment.
        Godaapp does not initiate transfers or send funds through a payment provider.
      </p>
    </div>
  );
}
