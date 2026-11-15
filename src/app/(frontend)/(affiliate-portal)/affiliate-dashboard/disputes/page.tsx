import { getAffiliateDisputes } from "../actions";
import { AffiliateDisputeForm } from "@/components/affiliate/AffiliateDisputeForm";
import {
  AffiliateEmptyState,
  AffiliatePageHeader,
  AffiliateStatusBadge,
  formatAffiliateDate,
} from "@/components/affiliate/AffiliatePortalUI";

function categoryLabel(category: string) {
  return {
    referral: "Referral or commission",
    payout: "Payout request",
    account: "Account access",
    other: "Other",
  }[category] ?? "Other";
}

export default async function AffiliateDisputesPage() {
  const disputes = await getAffiliateDisputes();

  return (
    <div className="space-y-6">
      <AffiliatePageHeader
        title="Disputes"
        description="Submit a concern and keep track of its review status and support response."
      />

      <AffiliateDisputeForm />

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Your cases</h2>
          <p className="mt-1 text-sm text-muted-foreground">Updates from the GodaApp team appear here.</p>
        </div>
        {disputes.length ? (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <article className="rounded-xl border border-border bg-card p-4 sm:p-5" key={dispute.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Case #{dispute.id} · {formatAffiliateDate(dispute.createdAt)} · {categoryLabel(dispute.category)}
                    </p>
                    <h3 className="mt-2 font-semibold">{dispute.subject}</h3>
                  </div>
                  <AffiliateStatusBadge status={dispute.status} />
                </div>
                {dispute.adminResponse && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-semibold">Support response</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {dispute.adminResponse}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <AffiliateEmptyState
            description="Submitted disputes will appear here with their review status."
            title="No cases submitted"
          />
        )}
      </section>
    </div>
  );
}
