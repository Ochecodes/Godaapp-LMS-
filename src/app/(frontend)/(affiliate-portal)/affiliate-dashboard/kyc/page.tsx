import { getAffiliateKycData } from "../actions";
import { AffiliateKycForm } from "@/components/affiliate/AffiliateKycForm";
import { AffiliatePageHeader } from "@/components/affiliate/AffiliatePortalUI";

export default async function AffiliateKycPage() {
  const values = await getAffiliateKycData();

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="KYC verification"
        description="Submit the minimum identity details required for the super-admin team to review your affiliate profile."
      />
      <AffiliateKycForm values={values} />
    </div>
  );
}
