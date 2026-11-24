import Link from "next/link";
import { CircleDollarSign, Clock3, Filter, RotateCcw } from "lucide-react";
import { getAffiliateBalanceData } from "../actions";
import { AffiliatePayoutRequestDialog } from "@/components/affiliate/AffiliatePayoutRequestDialog";
import {
  AffiliateEmptyState,
  AffiliateMetricCard,
  AffiliatePageHeader,
  AffiliateStatusBadge,
  formatAffiliateCurrency,
  formatAffiliateDate,
} from "@/components/affiliate/AffiliatePortalUI";
import { Button } from "@/components/ui/button";

type BalancePageProps = {
  searchParams: Promise<{ range?: string }>;
};

function isRange(value: string | undefined): value is "30d" | "90d" | "all" {
  return value === "30d" || value === "90d" || value === "all";
}

export default async function AffiliateBalancePage({ searchParams }: BalancePageProps) {
  const params = await searchParams;
  const range = isRange(params.range) ? params.range : "30d";
  const data = await getAffiliateBalanceData(range);

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="Balance"
        description="Review eligible commission credits. A payout request reserves all currently available credits while Godaapp staff review it."
        actions={
          data.metrics.kycStatus === "verified" && data.metrics.availableBalance > 0 ? (
            <AffiliatePayoutRequestDialog availableBalance={data.metrics.availableBalance} />
          ) : null
        }
      />

      <section aria-label="Balance summary" className="grid gap-3 lg:grid-cols-3">
        <AffiliateMetricCard
          detail="Unreserved referrals, less any prior payout adjustment"
          icon={CircleDollarSign}
          label="Available to request"
          tone="green"
          value={formatAffiliateCurrency(data.metrics.availableBalance)}
        />
        <AffiliateMetricCard
          detail="Credits tied to payout requests awaiting review"
          icon={Clock3}
          label="Reserved"
          tone="orange"
          value={formatAffiliateCurrency(data.metrics.reservedBalance)}
        />
        <AffiliateMetricCard
          detail="Refund, chargeback, or correction offsets awaiting a future payout"
          icon={RotateCcw}
          label="Ledger adjustments"
          tone="orange"
          value={formatAffiliateCurrency(data.metrics.adjustmentOffset)}
        />
      </section>

      {data.metrics.kycStatus !== "verified" && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">KYC verification is required before payout</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your available commissions remain in the ledger while an admin reviews your verification.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/affiliate-dashboard/kyc">Complete KYC</Link>
          </Button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold">Eligible referrals</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.rows.length} available {data.rows.length === 1 ? "credit" : "credits"} ·{" "}
              {formatAffiliateCurrency(data.periodTotal)} in this period
            </p>
          </div>
          <form action="/affiliate-dashboard/balance" className="flex flex-wrap items-end gap-2" method="get">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Time period
              <select
                className="h-9 min-w-36 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={range}
                name="range"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
            <Button size="sm" type="submit" variant="outline">
              <Filter aria-hidden="true" />
              Apply
            </Button>
          </form>
        </div>

        {data.rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Purchaser</th>
                    <th className="px-5 py-3 text-right font-medium">Commission (USD)</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatAffiliateDate(row.createdAt)}</td>
                      <td className="max-w-56 truncate px-5 py-4 font-medium">{row.course}</td>
                      <td className="px-5 py-4 text-muted-foreground">{row.purchaser}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">{formatAffiliateCurrency(row.commissionUSD)}</td>
                      <td className="px-5 py-4"><AffiliateStatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-muted/30">
                  <tr>
                    <td className="px-5 py-3 font-semibold" colSpan={3}>Visible period total</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatAffiliateCurrency(data.periodTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="p-4 sm:p-5">
            <AffiliateEmptyState
              description="New paid course checkouts appear here after the verified payment webhook records your commission."
              title="No available credits in this period"
            />
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Affiliate payouts are processed manually and offline. Submitting a request
        does not trigger a bank transfer or cryptocurrency payment.
      </p>
    </div>
  );
}
