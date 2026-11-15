import { AffiliateLinkManager } from "@/components/affiliate/AffiliateLinkManager";
import { AffiliatePageHeader } from "@/components/affiliate/AffiliatePortalUI";
import { getAffiliateDashboardData } from "../actions";

export default async function AffiliateLinksPage() {
  const data = await getAffiliateDashboardData();

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="Referral links"
        description="Create and manage the link that attributes paid course enrollments to your affiliate account."
      />
      <AffiliateLinkManager
        initialActive={data.referralLinkActive}
        initialCode={data.referralCode}
      />
    </div>
  );
}