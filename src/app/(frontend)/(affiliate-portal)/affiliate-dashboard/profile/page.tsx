import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { getAffiliateProfileData } from "../actions";
import type { LucideIcon } from "lucide-react";
import {
  AffiliatePageHeader,
  AffiliateStatusBadge,
} from "@/components/affiliate/AffiliatePortalUI";
import { Button } from "@/components/ui/button";

export default async function AffiliateProfilePage() {
  const profile = await getAffiliateProfileData();

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="Profile"
        description="Review the account details associated with your approved affiliate membership."
      />

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <UserRound aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{profile.fullName}</h2>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <AffiliateStatusBadge status={profile.membershipStatus} />
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-2">
          <ProfileDetail icon={Mail} label="Email address" value={profile.email} />
          <ProfileDetail icon={Phone} label="Phone number" value={profile.phone} />
          <ProfileDetail
            icon={ShieldCheck}
            label="KYC verification"
            value={<AffiliateStatusBadge status={profile.kycStatus.replace(/_/g, " ")} />}
          />
          <ProfileDetail
            icon={BadgeCheck}
            label="Referral link"
            value={profile.referralLinkActive ? "Active" : "Inactive"}
          />
          <ProfileDetail icon={UserRound} label="Referral code" value={profile.referralCode} />
        </dl>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold">Account access</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Your affiliate access follows the super-admin membership list. If
            access is revoked or these details need to change, contact support.
            Use the account menu at the bottom of the navigation to sign out.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/affiliate-dashboard/disputes">Contact support</Link>
        </Button>
      </section>
    </div>
  );
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 bg-card p-4 sm:p-5">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
