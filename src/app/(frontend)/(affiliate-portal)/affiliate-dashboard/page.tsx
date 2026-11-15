import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  MousePointerClick,
  UsersRound,
} from "lucide-react";
import { getAffiliateDashboardData } from "./actions";
import { AffiliateReferralLink } from "@/components/affiliate/AffiliateReferralLink";
import {
  AffiliateEmptyState,
  AffiliateMetricCard,
  AffiliatePageHeader,
  AffiliateStatusBadge,
  formatAffiliateCurrency,
  formatAffiliateDate,
} from "@/components/affiliate/AffiliatePortalUI";
import { Button } from "@/components/ui/button";

export default async function AffiliateDashboardPage() {
  const data = await getAffiliateDashboardData();

  return (
    <div className="space-y-7">
      <AffiliatePageHeader
        title={`Welcome back, ${data.fullName.split(" ")[0]}`}
        description="A clear view of your referrals, available commissions, and offline payout activity."
        actions={
          <Button asChild>
            <Link href="/affiliate-dashboard/balance">
              View balance
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {data.metrics.kycStatus !== "verified" && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="text-sm font-semibold">Complete identity verification</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                KYC must be verified before you can request an offline payout. Your
                dashboard and referral links remain available while it is reviewed.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/affiliate-dashboard/kyc">Open KYC</Link>
          </Button>
        </div>
      )}

      <section aria-label="Affiliate account summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AffiliateMetricCard
          detail="Ready to request after verification"
          icon={CircleDollarSign}
          label="Available balance"
          tone="green"
          value={formatAffiliateCurrency(data.metrics.availableBalance)}
        />
        <AffiliateMetricCard
          detail="Credits reserved by open requests"
          icon={Clock3}
          label="In review"
          tone="orange"
          value={formatAffiliateCurrency(data.metrics.reservedBalance)}
        />
        <AffiliateMetricCard
          detail="Commission from eligible paid enrollments"
          icon={MousePointerClick}
          label="Total earned"
          tone="blue"
          value={formatAffiliateCurrency(data.metrics.totalEarned)}
        />
        <AffiliateMetricCard
          detail="Paid course checkouts attributed to your link"
          icon={UsersRound}
          label="Successful referrals"
          value={String(data.metrics.totalReferrals)}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="min-w-0 rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold">Recent referrals</h2>
              <p className="mt-1 text-xs text-muted-foreground">Latest paid enrollments credited to your account.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate-dashboard/balance">View balance</Link>
            </Button>
          </div>
          {data.recentReferrals.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Purchaser</th>
                    <th className="px-5 py-3 text-right font-medium">Commission</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentReferrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{formatAffiliateDate(referral.createdAt)}</td>
                      <td className="max-w-48 truncate px-5 py-3.5 font-medium">{referral.course}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{referral.purchaser}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-medium tabular-nums">{formatAffiliateCurrency(referral.commissionUSD)}</td>
                      <td className="px-5 py-3.5"><AffiliateStatusBadge status={referral.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <AffiliateEmptyState
                description="Once someone enrolls in and pays for a course through your active link, the commission will appear here."
                title="No referrals yet"
                action={
                  <Button asChild variant="outline">
                    <Link href="/affiliate-dashboard/links">Manage referral link</Link>
                  </Button>
                }
              />
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Your referral link</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Share it with your audience. Only paid course checkouts count.
                </p>
              </div>
              <Link
                aria-label="Manage referral link"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/affiliate-dashboard/links"
              >
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <AffiliateReferralLink
              active={data.referralLinkActive}
              referralCode={data.referralCode}
            />
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
              <div>
                <h2 className="font-semibold">Payout activity</h2>
                <p className="mt-1 text-xs text-muted-foreground">Requests are reviewed and paid manually.</p>
              </div>
              <Link
                className="text-xs font-medium text-primary hover:underline"
                href="/affiliate-dashboard/payouts"
              >
                View all
              </Link>
            </div>
            {data.recentPayouts.length ? (
              <ul className="divide-y divide-border">
                {data.recentPayouts.map((payout) => (
                  <li className="flex items-center justify-between gap-3 px-4 py-3.5" key={payout.id}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{formatAffiliateCurrency(payout.amountUSD)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatAffiliateDate(payout.createdAt)}</p>
                    </div>
                    <AffiliateStatusBadge
                      status={payout.status === "approved" ? "Paid offline" : payout.status}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm text-muted-foreground">No payout requests yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
