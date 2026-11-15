import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AffiliateDashboardShell } from "@/components/affiliate/AffiliateDashboardShell";
import { requireAffiliatePortalContext } from "@/lib/affiliate-membership";

export default async function AffiliateDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await requireAffiliatePortalContext();
  if (!context) redirect("/affiliate/sign-in?access=restricted");

  return (
    <AffiliateDashboardShell
      fullName={context.application.fullName}
      email={context.authUser.email ?? context.application.email}
      referralCode={context.affiliate.referralCode}
      referralLinkActive={context.affiliate.referralLinkActive}
    >
      {children}
    </AffiliateDashboardShell>
  );
}