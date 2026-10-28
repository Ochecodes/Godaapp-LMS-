import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { isActivePayloadAdmin } from "@/lib/payload-access";
import { getTinybirdAnalytics, isTinybirdConfigured } from "@/lib/tinybird/client";
import type { Course, Enrollment, Instructor, PayoutRequest, Referral } from "../../../../../../payload-types";

function relationId(relation: number | { id: number }) {
  return typeof relation === "number" ? relation : relation.id;
}

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isActivePayloadAdmin(user)) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const [
    usersResult,
    instructorsResult,
    coursesResult,
    enrollmentsResult,
    payoutRequestsResult,
    referralsResult,
  ] = await Promise.all([
    payload.find({ collection: "users", limit: 1, overrideAccess: true }),
    payload.find({ collection: "instructors", limit: 1, overrideAccess: true }),
    payload.find({ collection: "courses", limit: 10000, pagination: false, overrideAccess: true }),
    payload.find({ collection: "enrollments", limit: 10000, pagination: false, overrideAccess: true }),
    payload.find({ collection: "payout-requests", limit: 10000, pagination: false, overrideAccess: true }),
    payload.find({ collection: "referrals", limit: 10000, pagination: false, overrideAccess: true }),
  ]);

  const courses = coursesResult.docs as Course[];
  const enrollments = enrollmentsResult.docs as Enrollment[];
  const payoutRequests = payoutRequestsResult.docs as PayoutRequest[];
  const referrals = referralsResult.docs as Referral[];
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.isActive);
  const paidUsers = new Set<string>();
  const freeUsers = new Set<string>();

  for (const enrollment of activeEnrollments) {
    const course = courseById.get(relationId(enrollment.course));
    if (!course) continue;
    const email = enrollment.email.trim().toLowerCase();
    if (course.priceUSD > 0) paidUsers.add(email);
    else if (course.priceUSD === 0) freeUsers.add(email);
  }

  const paidPayouts = payoutRequests.filter((payout) => payout.status === "approved");
  const paidAffiliatePayoutAmount = paidPayouts.reduce(
    (total, payout) => total + payout.amountRequested,
    0,
  );
  const paidReferralCommissions = referrals
    .filter((referral) => referral.payoutStatus === "paid")
    .reduce((total, referral) => total + referral.commissionAmount, 0);

  let tinybird: Awaited<ReturnType<typeof getTinybirdAnalytics>> | null = null;
  let analyticsError: string | null = null;
  if (isTinybirdConfigured()) {
    try {
      tinybird = await getTinybirdAnalytics();
    } catch (error) {
      analyticsError = "Traffic analytics are temporarily unavailable.";
      console.error("[Admin analytics] Tinybird query failed:", error);
    }
  } else {
    analyticsError = "Tinybird is not configured on the server.";
  }

  const summary = tinybird?.summary;
  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    sourceStatus: summary ? "ready" : "unavailable",
    analyticsError,
    metrics: {
      totalUsers: usersResult.totalDocs,
      instructors: instructorsResult.totalDocs,
      courses: coursesResult.totalDocs,
      activeEnrollments: activeEnrollments.length,
      paidUsers: paidUsers.size,
      freeUsers: freeUsers.size,
      referrals: referrals.length,
      affiliatePayouts: paidPayouts.length,
      affiliatePayoutAmountUsd: paidAffiliatePayoutAmount,
      paidReferralCommissionsUsd: paidReferralCommissions,
      pageViews: summary ? Number(summary.page_views) : null,
      siteVisits: summary ? Number(summary.site_visits) : null,
      abandonedCheckouts: summary
        ? Math.max(Number(summary.checkout_starts) - Number(summary.paid_transactions), 0)
        : null,
      deletedAccounts: summary ? Number(summary.deleted_accounts) : null,
      totalEarnedUsd: summary ? Number(summary.gross_revenue_usd) : null,
      tinybirdPaidTransactions: summary ? Number(summary.paid_transactions) : null,
    },
    dailyActivity: tinybird?.dailyActivity ?? [],
    courseActivity: tinybird?.courseActivity ?? [],
  });
}
