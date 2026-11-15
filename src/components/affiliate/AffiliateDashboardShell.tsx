"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  Link2,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { signOutAffiliate } from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";
import { AffiliateReferralLink } from "./AffiliateReferralLink";

const navigation = [
  { href: "/affiliate-dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/affiliate-dashboard/balance", label: "Balance", icon: WalletCards },
  { href: "/affiliate-dashboard/payouts", label: "Payouts history", icon: ReceiptText },
  { href: "/affiliate-dashboard/links", label: "Referral links", icon: Link2 },
  { href: "/affiliate-dashboard/disputes", label: "Disputes", icon: CircleHelp },
  { href: "/affiliate-dashboard/kyc", label: "KYC", icon: BadgeCheck },
];

type AffiliateDashboardShellProps = {
  children: ReactNode;
  email: string;
  fullName: string;
  referralCode: string;
  referralLinkActive?: boolean;
};

export function AffiliateDashboardShell({
  children,
  email,
  fullName,
  referralCode,
  referralLinkActive = true,
}: AffiliateDashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/40 text-foreground lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-card lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-6">
          <Link className="text-xl font-semibold tracking-tight" href="/affiliate-dashboard">
            GodaApp
          </Link>
          <p className="hidden text-xs text-muted-foreground lg:mt-1 lg:block">
            Affiliate workspace
          </p>
        </div>

        <nav
          aria-label="Affiliate navigation"
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3"
        >
          {navigation.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <details className="group relative border-t border-border px-4 py-3 lg:mt-auto">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {fullName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{fullName}</span>
              <span className="block truncate text-xs text-muted-foreground">{email}</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="absolute left-4 right-4 top-[calc(100%+0.5rem)] z-40 grid gap-1 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg lg:bottom-[calc(100%+0.5rem)] lg:top-auto">
            <Link
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/affiliate-dashboard/profile"
            >
              Profile
            </Link>
            <form action={signOutAffiliate}>
              <button
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </details>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-7">
          <div>
            <p className="text-sm font-semibold">Affiliate portal</p>
            <p className="text-xs text-muted-foreground">Manage referrals and account activity</p>
          </div>
          <AffiliateReferralLink
            active={referralLinkActive}
            referralCode={referralCode}
            compact
          />
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
