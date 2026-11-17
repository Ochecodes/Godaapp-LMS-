"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizeAffiliateEmail } from "@/lib/affiliate-application";
import { generateUniqueAffiliateReferralCode } from "@/lib/affiliate-membership";

type ReferralDocument = {
  id: number;
  affiliate: number | { id: number };
  course: number | { id: number; title?: string } | null;
  referredEmail: string;
  commissionAmount: number;
  payoutStatus: "unpaid" | "pending" | "paid";
  isReversed?: boolean | null;
  providerCheckoutId?: string | null;
  payoutRequest?: number | { id: number } | null;
  payoutHistory?: Array<{
    payoutRequestId: number;
    status: "reserved" | "released" | "paid";
    amount: number;
    changedAt: string;
  }> | null;
  createdAt: string;
};

type AdjustmentDocument = {
  id: number;
  affiliate: number | { id: number };
  referral: number | { id: number };
  amount: number;
  reason: "refund" | "chargeback" | "manual_correction";
  reference?: string | null;
  status: "unapplied" | "reserved" | "applied";
  payoutRequest?: number | { id: number } | null;
  createdAt: string;
};

type PayoutDocument = {
  id: number;
  amountRequested: number;
  priorPayoutOffset?: number | null;
  adjustmentOffset?: number | null;
  status: "pending" | "approved" | "rejected";
  payoutMethod?: "bank_transfer" | "usdt_trc20" | null;
  transactionReference?: string | null;
  paidAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

type ReferralRow = {
  id: number;
  course: string;
  purchaser: string;
  commissionUSD: number;
  status: "Available" | "Reserved" | "Paid" | "Reversed" | "Released";
  createdAt: string;
};

export type AffiliateMetrics = {
  totalReferrals: number;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  reservedBalance: number;
  adjustmentOffset: number;
  accountStatus: "approved";
  kycStatus: string;
};

export type AffiliateActionState = {
  success?: string;
  error?: string;
  requestId?: number;
};

export type ReferralLinkActionResult = {
  success?: string;
  error?: string;
  referralCode?: string;
  active?: boolean;
};

export type KycActionState = {
  success?: string;
  error?: string;
};

function isIdentityType(
  value: string,
): value is "passport" | "national_id" | "drivers_license" {
  return value === "passport" || value === "national_id" || value === "drivers_license";
}

async function hasApprovedMembership(
  payload: Awaited<ReturnType<typeof getPayload>>,
  email: string,
  affiliateId: number,
): Promise<boolean> {
  const membership = await payload.find({
    collection: "affiliate-applications",
    where: {
      and: [
        { email: { equals: normalizeAffiliateEmail(email) } },
        { affiliate: { equals: affiliateId } },
        { status: { equals: "approved" } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });

  return membership.docs.length > 0;
}

async function requireAffiliateContext() {
  const payload = await getPayload({ config });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[Affiliate] Could not verify the current session:", error);
    throw new Error("Your session could not be verified. Please sign in again.");
  }

  const user = data.user;
  if (!user?.email || !user.email_confirmed_at) {
    throw new Error("Authentication required.");
  }

  const payloadUser = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  });
  const platformUser = payloadUser.docs[0];
  if (!platformUser) throw new Error("Your platform profile could not be found.");

  const affiliateResult = await payload.find({
    collection: "affiliates",
    where: { user: { equals: platformUser.id } },
    limit: 1,
    overrideAccess: true,
  });
  const affiliate = affiliateResult.docs[0];
  if (
    !affiliate ||
    affiliate.status !== "approved" ||
    !(await hasApprovedMembership(payload, user.email, affiliate.id))
  ) {
    throw new Error("Affiliate membership is not active.");
  }

  const applicationResult = await payload.find({
    collection: "affiliate-applications",
    where: {
      and: [
        { affiliate: { equals: affiliate.id } },
        { email: { equals: normalizeAffiliateEmail(user.email) } },
        { status: { equals: "approved" } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });
  const application = applicationResult.docs[0];
  if (!application) throw new Error("Affiliate membership is not active.");

  return { payload, user, platformUser, affiliate, application };
}

async function loadAffiliateLedger(context: Awaited<ReturnType<typeof requireAffiliateContext>>) {
  const [referralResult, payoutResult, kycResult, adjustmentResult] = await Promise.all([
    context.payload.find({
      collection: "referrals",
      where: { affiliate: { equals: context.affiliate.id } },
      depth: 1,
      pagination: false,
      overrideAccess: true,
    }),
    context.payload.find({
      collection: "payout-requests",
      where: { affiliate: { equals: context.affiliate.id } },
      pagination: false,
      overrideAccess: true,
    }),
    context.payload.find({
      collection: "affiliate-kyc",
      where: { affiliate: { equals: context.affiliate.id } },
      limit: 1,
      overrideAccess: true,
    }),
    context.payload.find({
      collection: "affiliate-ledger-adjustments",
      where: { affiliate: { equals: context.affiliate.id } },
      pagination: false,
      overrideAccess: true,
    }),
  ]);

  return {
    referrals: referralResult.docs as ReferralDocument[],
    payouts: payoutResult.docs as PayoutDocument[],
    kyc: kycResult.docs[0] ?? null,
    adjustments: adjustmentResult.docs as AdjustmentDocument[],
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((sum, value) => sum + value, 0));
}

function relationId(value: number | { id: number } | null | undefined): number | null {
  if (typeof value === "number") return value;
  return value?.id ?? null;
}

function formatCourse(course: ReferralDocument["course"]): string {
  return typeof course === "object" && course !== null && course.title
    ? course.title
    : "Course";
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Purchaser";
  return `${name.slice(0, 1)}•••@${domain}`;
}

function toReferralRow(referral: ReferralDocument): ReferralRow {
  const status = referral.isReversed
    ? "Reversed"
    : referral.payoutStatus === "pending"
      ? "Reserved"
      : referral.payoutStatus === "paid"
        ? "Paid"
        : "Available";

  return {
    id: referral.id,
    course: formatCourse(referral.course),
    purchaser: maskEmail(referral.referredEmail),
    commissionUSD: roundMoney(referral.commissionAmount),
    status,
    createdAt: referral.createdAt,
  };
}

function getReferralPayoutEvent(
  referral: ReferralDocument,
  payoutRequestId: number,
) {
  const history = referral.payoutHistory ?? [];
  return [...history]
    .reverse()
    .find((entry) => entry.payoutRequestId === payoutRequestId);
}

async function releasePayoutReservation(
  context: Awaited<ReturnType<typeof requireAffiliateContext>>,
  payoutRequestId: number,
) {
  const allocated = await context.payload.find({
    collection: "referrals",
    where: { payoutRequest: { equals: payoutRequestId } },
    pagination: false,
    overrideAccess: true,
  });
  const changedAt = new Date().toISOString();

  for (const referral of allocated.docs as ReferralDocument[]) {
    const history = referral.payoutHistory ?? [];
    const alreadyReleased = history.some(
      (entry) =>
        entry.payoutRequestId === payoutRequestId && entry.status === "released",
    );
    await context.payload.update({
      collection: "referrals",
      id: referral.id,
      data: {
        payoutStatus: "unpaid",
        payoutRequest: null,
        payoutHistory: alreadyReleased
          ? history
          : [
              ...history,
              {
                payoutRequestId,
                status: "released",
                amount: referral.commissionAmount,
                changedAt,
              },
            ],
      },
      overrideAccess: true,
    });
  }

  await context.payload.update({
    collection: "affiliate-ledger-adjustments",
    where: { payoutRequest: { equals: payoutRequestId } },
    data: { status: "unapplied", payoutRequest: null },
    overrideAccess: true,
  });
  await context.payload.delete({
    collection: "payout-requests",
    id: payoutRequestId,
    overrideAccess: true,
  });
}

function getLegacyAmounts(referrals: ReferralDocument[], payouts: PayoutDocument[]) {
  const allocatedPayoutIds = new Set(
    referrals
      .map((referral) => relationId(referral.payoutRequest))
      .filter((id): id is number => id !== null),
  );
  const legacySettled = payouts
    .filter((payout) => payout.status === "approved" && !allocatedPayoutIds.has(payout.id))
    .map((payout) => payout.amountRequested);
  const legacyPending = payouts
    .filter((payout) => payout.status === "pending" && !allocatedPayoutIds.has(payout.id))
    .map((payout) => payout.amountRequested);
  const allocatedOffsets = payouts
    .filter((payout) => payout.status !== "rejected")
    .map((payout) => payout.priorPayoutOffset ?? 0);

  return {
    settledOffset: roundMoney(
      Math.max(0, sumMoney(legacySettled) - sumMoney(allocatedOffsets)),
    ),
    pendingReservation: sumMoney(legacyPending),
  };
}

function calculateMetrics(
  referrals: ReferralDocument[],
  payouts: PayoutDocument[],
  adjustments: AdjustmentDocument[],
  kycStatus: string,
): AffiliateMetrics {
  const activeReferrals = referrals.filter((referral) => !referral.isReversed);
  const legacy = getLegacyAmounts(referrals, payouts);
  const unpaid = sumMoney(
    activeReferrals
      .filter((referral) => referral.payoutStatus === "unpaid" && !referral.payoutRequest)
      .map((referral) => referral.commissionAmount),
  );
  const reserved = sumMoney(
    payouts.filter((payout) => payout.status === "pending").map((payout) => payout.amountRequested),
  );
  const adjustmentOffset = sumMoney(
    adjustments
      .filter((adjustment) => adjustment.status === "unapplied")
      .map((adjustment) => adjustment.amount),
  );

  return {
    totalReferrals: activeReferrals.length,
    totalEarned: sumMoney(activeReferrals.map((referral) => referral.commissionAmount)),
    totalWithdrawn: sumMoney(
      payouts
        .filter((payout) => payout.status === "approved")
        .map((payout) => payout.amountRequested),
    ),
    availableBalance: roundMoney(
      Math.max(
        0,
        unpaid - legacy.settledOffset - legacy.pendingReservation - adjustmentOffset,
      ),
    ),
    reservedBalance: roundMoney(reserved),
    adjustmentOffset,
    accountStatus: "approved",
    kycStatus,
  };
}

export async function getAffiliateDashboardMetrics(): Promise<AffiliateMetrics> {
  const context = await requireAffiliateContext();
  const ledger = await loadAffiliateLedger(context);
  return calculateMetrics(
    ledger.referrals,
    ledger.payouts,
    ledger.adjustments,
    ledger.kyc?.status ?? "not_started",
  );
}

export async function getAffiliateDashboardData() {
  const context = await requireAffiliateContext();
  const ledger = await loadAffiliateLedger(context);
  const metrics = calculateMetrics(
    ledger.referrals,
    ledger.payouts,
    ledger.adjustments,
    ledger.kyc?.status ?? "not_started",
  );

  return {
    metrics,
    fullName: context.application.fullName,
    referralCode: context.affiliate.referralCode,
    referralLinkActive: Boolean(context.affiliate.referralLinkActive),
    recentReferrals: ledger.referrals
      .filter((referral) => !referral.isReversed)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 6)
      .map(toReferralRow),
    recentPayouts: ledger.payouts
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 4)
      .map((payout) => ({
        id: payout.id,
        amountUSD: roundMoney(payout.amountRequested),
        status: payout.status,
        createdAt: payout.createdAt,
        payoutMethod: payout.payoutMethod ?? null,
      })),
  };
}

export async function getAffiliateProfileData() {
  const context = await requireAffiliateContext();
  const kycResult = await context.payload.find({
    collection: "affiliate-kyc",
    where: { affiliate: { equals: context.affiliate.id } },
    limit: 1,
    overrideAccess: true,
  });
  return {
    fullName: context.application.fullName,
    email: normalizeAffiliateEmail(context.user.email ?? context.application.email),
    phone: context.application.phone,
    membershipStatus: context.application.status,
    referralCode: context.affiliate.referralCode,
    referralLinkActive: Boolean(context.affiliate.referralLinkActive),
    kycStatus: kycResult.docs[0]?.status ?? "not_started",
  };
}

export async function getAffiliateBalanceData(range: "30d" | "90d" | "all" = "30d") {
  const context = await requireAffiliateContext();
  const ledger = await loadAffiliateLedger(context);
  const metrics = calculateMetrics(
    ledger.referrals,
    ledger.payouts,
    ledger.adjustments,
    ledger.kyc?.status ?? "not_started",
  );
  const cutoff =
    range === "all"
      ? null
      : Date.now() - (range === "90d" ? 90 : 30) * 24 * 60 * 60 * 1000;
  const rows = ledger.referrals
    .filter(
      (referral) =>
        !referral.isReversed &&
        referral.payoutStatus === "unpaid" &&
        !referral.payoutRequest &&
        (cutoff === null || Date.parse(referral.createdAt) >= cutoff),
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map(toReferralRow);

  return {
    metrics,
    rows,
    periodTotal: sumMoney(rows.map((row) => row.commissionUSD)),
    range,
  };
}

function formatPayoutHistory(
  ledger: Awaited<ReturnType<typeof loadAffiliateLedger>>,
) {
  return ledger.payouts
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((payout) => ({
      id: payout.id,
      amountUSD: roundMoney(payout.amountRequested),
      priorPayoutOffset: roundMoney(payout.priorPayoutOffset ?? 0),
      adjustmentOffset: roundMoney(payout.adjustmentOffset ?? 0),
      status: payout.status,
      payoutMethod: payout.payoutMethod ?? null,
      transactionReference: payout.transactionReference ?? "",
      paidAt: payout.paidAt ?? null,
      rejectionReason: payout.rejectionReason ?? "",
      createdAt: payout.createdAt,
      referrals: ledger.referrals
        .filter(
          (referral) =>
            relationId(referral.payoutRequest) === payout.id ||
            getReferralPayoutEvent(referral, payout.id),
        )
        .map((referral) => {
          const event = getReferralPayoutEvent(referral, payout.id);
          const row = toReferralRow(referral);
          if (!event) return row;
          return {
            ...row,
            status:
              event.status === "paid"
                ? "Paid"
                : event.status === "released"
                  ? "Released"
                  : "Reserved",
          };
        }),
      adjustments: ledger.adjustments
        .filter((adjustment) => relationId(adjustment.payoutRequest) === payout.id)
        .map((adjustment) => ({
          id: adjustment.id,
          amountUSD: roundMoney(adjustment.amount),
          reason: adjustment.reason,
          reference: adjustment.reference ?? "",
          status: adjustment.status,
        })),
    }));
}

export async function getAffiliatePayoutHistory() {
  const context = await requireAffiliateContext();
  const ledger = await loadAffiliateLedger(context);
  return formatPayoutHistory(ledger);
}

export async function getAffiliatePayoutPageData() {
  const context = await requireAffiliateContext();
  const ledger = await loadAffiliateLedger(context);
  return {
    payouts: formatPayoutHistory(ledger),
    adjustments: ledger.adjustments
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((adjustment) => ({
        id: adjustment.id,
        amountUSD: roundMoney(adjustment.amount),
        reason: adjustment.reason,
        reference: adjustment.reference ?? "",
        status: adjustment.status,
        createdAt: adjustment.createdAt,
        payoutRequestId: relationId(adjustment.payoutRequest),
      })),
  };
}

function csvCell(value: string | number): string {
  const text = String(value).replace(/[\r\n]+/g, " ");
  const safe = /^[=+\-@\t]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function getAffiliatePayoutsCsv(): Promise<string> {
  const data = await getAffiliatePayoutPageData();
  const history = data.payouts;
  const rows: Array<Array<string | number>> = [[
    "Payout request",
    "Requested at",
    "Course",
    "Commission USD",
    "Adjustment USD",
    "Payout amount USD",
    "Status",
    "Method",
    "Paid at",
    "Transaction reference",
    "Adjustment type",
    "Adjustment status",
  ]];

  for (const payout of history) {
    rows.push([
      payout.id,
      payout.createdAt,
      "Payout request",
      0,
      payout.adjustmentOffset,
      payout.amountUSD,
      payout.status,
      payout.payoutMethod ?? "",
      payout.paidAt ?? "",
      payout.transactionReference,
      "",
      "",
    ]);
    for (const credit of payout.referrals) {
      rows.push([
        payout.id,
        credit.createdAt,
        credit.course,
        credit.commissionUSD,
        0,
        0,
        credit.status,
        payout.payoutMethod ?? "",
        "",
        "",
        "",
        "",
      ]);
    }
    for (const adjustment of payout.adjustments) {
      rows.push([
        payout.id,
        payout.createdAt,
        "Ledger adjustment",
        0,
        adjustment.amountUSD,
        0,
        adjustment.status,
        payout.payoutMethod ?? "",
        "",
        adjustment.reference,
        adjustment.reason,
        adjustment.status,
      ]);
    }
  }

  for (const adjustment of data.adjustments.filter((item) => item.payoutRequestId === null)) {
    rows.push([
      "",
      adjustment.createdAt,
      "Ledger adjustment",
      0,
      adjustment.amountUSD,
      0,
      "",
      "",
      "",
      adjustment.reference,
      adjustment.reason,
      adjustment.status,
    ]);
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function getAffiliateDisputes() {
  const context = await requireAffiliateContext();
  const result = await context.payload.find({
    collection: "affiliate-disputes",
    where: { affiliate: { equals: context.affiliate.id } },
    sort: "-createdAt",
    limit: 100,
    overrideAccess: true,
  });

  return result.docs.map((dispute) => ({
    id: dispute.id,
    subject: dispute.subject,
    category: dispute.category,
    status: dispute.status,
    adminResponse: dispute.adminResponse ?? "",
    createdAt: dispute.createdAt,
    resolvedAt: dispute.resolvedAt ?? null,
  }));
}

export async function getAffiliateKycData() {
  const context = await requireAffiliateContext();
  const result = await context.payload.find({
    collection: "affiliate-kyc",
    where: { affiliate: { equals: context.affiliate.id } },
    limit: 1,
    overrideAccess: true,
  });
  const kyc = result.docs[0];

  return {
    status: kyc?.status ?? "not_started",
    legalName: kyc?.legalName ?? context.application.fullName,
    dateOfBirth: kyc?.dateOfBirth?.slice(0, 10) ?? "",
    country: kyc?.country ?? "",
    residentialAddress: kyc?.residentialAddress ?? "",
    identityType: kyc?.identityType ?? "passport",
    identityLastFour: kyc?.identityLastFour ?? "",
    reviewNotes: kyc?.reviewNotes ?? "",
  };
}

export async function submitAffiliateKyc(
  _previousState: KycActionState,
  formData: FormData,
): Promise<KycActionState> {
  try {
    const context = await requireAffiliateContext();
    const legalName = String(formData.get("legalName") ?? "").trim();
    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    const residentialAddress = String(formData.get("residentialAddress") ?? "").trim();
    const identityTypeValue = String(formData.get("identityType") ?? "");
    const identityLastFour = String(formData.get("identityLastFour") ?? "").trim();

    if (legalName.length < 2 || legalName.length > 120) {
      return { error: "Enter your legal name (2–120 characters)." };
    }
    const birthDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate.toISOString().slice(0, 10) !== dateOfBirth ||
      birthDate.getTime() > Date.now()
    ) {
      return { error: "Enter a valid date of birth." };
    }
    if (!country || country.length > 100) return { error: "Enter your country." };
    if (residentialAddress.length < 5 || residentialAddress.length > 500) {
      return { error: "Enter your residential address (5–500 characters)." };
    }
    if (!isIdentityType(identityTypeValue)) {
      return { error: "Choose an identity document type." };
    }
    const identityType = identityTypeValue;
    if (!/^\d{4}$/.test(identityLastFour)) {
      return { error: "Enter only the last four digits of your identity number." };
    }

    const existingResult = await context.payload.find({
      collection: "affiliate-kyc",
      where: { affiliate: { equals: context.affiliate.id } },
      limit: 1,
      overrideAccess: true,
    });
    const existing = existingResult.docs[0];
    if (existing?.status === "verified") {
      return { error: "Your identity profile is already verified. Contact support if it needs to change." };
    }

    const data = {
      affiliate: context.affiliate.id,
      legalName,
      dateOfBirth: `${dateOfBirth}T00:00:00.000Z`,
      country,
      residentialAddress,
      identityType,
      identityLastFour,
      status: "submitted" as const,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNotes: null,
    };

    if (existing) {
      await context.payload.update({
        collection: "affiliate-kyc",
        id: existing.id,
        data,
        overrideAccess: true,
      });
    } else {
      await context.payload.create({
        collection: "affiliate-kyc",
        data,
        overrideAccess: true,
      });
    }

    revalidatePath("/affiliate-dashboard/kyc");
    revalidatePath("/affiliate-dashboard/balance");
    return { success: "Your verification details were submitted for review." };
  } catch (error) {
    console.error("[Affiliate] KYC submission failed:", error);
    return {
      error: "The KYC submission could not be completed. Please try again.",
    };
  }
}

export async function rotateAffiliateReferralLink(): Promise<ReferralLinkActionResult> {
  try {
    const context = await requireAffiliateContext();
    const referralCode = await generateUniqueAffiliateReferralCode(context.payload);
    await context.payload.update({
      collection: "affiliates",
      id: context.affiliate.id,
      data: { referralCode, referralLinkActive: true },
      overrideAccess: true,
    });
    revalidatePath("/affiliate-dashboard");
    revalidatePath("/affiliate-dashboard/links");
    return { success: "A new referral link is ready.", referralCode, active: true };
  } catch (error) {
    console.error("[Affiliate] Referral link creation failed:", error);
    return {
      error: "A referral link could not be created. Please try again.",
    };
  }
}

export async function deactivateAffiliateReferralLink(): Promise<ReferralLinkActionResult> {
  try {
    const context = await requireAffiliateContext();
    await context.payload.update({
      collection: "affiliates",
      id: context.affiliate.id,
      data: { referralLinkActive: false },
      overrideAccess: true,
    });
    revalidatePath("/affiliate-dashboard");
    revalidatePath("/affiliate-dashboard/links");
    return { success: "Your referral link was deactivated.", active: false };
  } catch (error) {
    console.error("[Affiliate] Referral link deactivation failed:", error);
    return {
      error: "The referral link could not be deactivated. Please try again.",
    };
  }
}

export async function requestAffiliateWithdrawal(
  _previousState: AffiliateActionState,
  formData: FormData,
): Promise<AffiliateActionState> {
  try {
    const context = await requireAffiliateContext();
    const ledger = await loadAffiliateLedger(context);
    if (ledger.kyc?.status !== "verified") {
      return { error: "Complete KYC verification before requesting a payout." };
    }
    if (formData.get("confirmDetails") !== "yes") {
      return { error: "Confirm that your payout details are accurate before submitting." };
    }

    const payoutMethodValue = String(formData.get("payoutMethod") ?? "");
    const country = String(formData.get("country") ?? "").trim();
    const accountName = String(formData.get("accountName") ?? "").trim();
    const bankName = String(formData.get("bankName") ?? "").trim();
    const accountNumber = String(formData.get("accountNumber") ?? "").trim();
    const walletAddress = String(formData.get("walletAddress") ?? "").trim();

    if (payoutMethodValue !== "bank_transfer" && payoutMethodValue !== "usdt_trc20") {
      return { error: "Choose a payout method." };
    }
    const payoutMethod = payoutMethodValue;
    if (!country || country.length > 100) return { error: "Enter your country." };
    if (accountName.length < 2 || accountName.length > 120) {
      return { error: "Enter the name on your payout account." };
    }

    if (payoutMethod === "bank_transfer") {
      if (!bankName || bankName.length > 120) return { error: "Enter your bank name." };
      if (accountNumber.length < 4 || accountNumber.length > 80) {
        return { error: "Enter a valid bank account number." };
      }
    } else if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(walletAddress)) {
      return { error: "Enter a valid TRC-20 wallet address." };
    }

    const eligibleReferrals = ledger.referrals.filter(
      (referral) =>
        !referral.isReversed &&
        referral.payoutStatus === "unpaid" &&
        !referral.payoutRequest,
    );
    const expectedBalanceInput = String(formData.get("expectedAvailableBalance") ?? "");
    if (!/^\d+(?:\.\d{1,2})?$/.test(expectedBalanceInput)) {
      return { error: "Refresh the page and review your available balance before submitting." };
    }
    const expectedAvailableBalance = Number(expectedBalanceInput);
    if (!Number.isFinite(expectedAvailableBalance) || expectedAvailableBalance < 0) {
      return { error: "Refresh the page and review your available balance before submitting." };
    }
    const grossAvailable = sumMoney(
      eligibleReferrals.map((referral) => referral.commissionAmount),
    );
    const legacy = getLegacyAmounts(ledger.referrals, ledger.payouts);
    const priorPayoutOffset = Math.min(legacy.settledOffset, grossAvailable);
    const unappliedAdjustments = ledger.adjustments
      .filter((adjustment) => adjustment.status === "unapplied")
      .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
    const adjustmentOffset = sumMoney(unappliedAdjustments.map((adjustment) => adjustment.amount));
    const amountAvailableForAdjustments = Math.max(
      0,
      roundMoney(grossAvailable - priorPayoutOffset - legacy.pendingReservation),
    );
    const selectedAdjustments =
      adjustmentOffset <= amountAvailableForAdjustments ? unappliedAdjustments : [];
    const amountRequested =
      selectedAdjustments.length === unappliedAdjustments.length
        ? roundMoney(amountAvailableForAdjustments - adjustmentOffset)
        : 0;
    if (!Number.isFinite(amountRequested) || amountRequested <= 0) {
      return { error: "There is no available balance to request right now." };
    }
    if (expectedAvailableBalance !== amountRequested) {
      return {
        error: "Your available balance changed. Refresh the page and review the amount before submitting.",
      };
    }
    if (!eligibleReferrals.length) {
      return { error: "There are no eligible referral credits to reserve." };
    }

    const request = await context.payload.create({
      collection: "payout-requests",
      data: {
        affiliate: context.affiliate.id,
        amountRequested,
        priorPayoutOffset,
        adjustmentOffset,
        payoutMethod,
        country,
        accountName,
        ...(payoutMethod === "bank_transfer"
          ? { bankName, accountNumber, walletAddress: null, network: null }
          : { bankName: null, accountNumber: null, walletAddress, network: "TRC-20" }),
        status: "pending",
      },
      overrideAccess: true,
    });

    const referralIds = eligibleReferrals.map((referral) => referral.id);
    const adjustmentIds = selectedAdjustments.map((adjustment) => adjustment.id);
    try {
      const allocated = await context.payload.update({
        collection: "referrals",
        where: {
          and: [
            { id: { in: referralIds } },
            { affiliate: { equals: context.affiliate.id } },
            { payoutStatus: { equals: "unpaid" } },
            { isReversed: { not_equals: true } },
            { payoutRequest: { equals: null } },
          ],
        },
        limit: referralIds.length,
        data: {
          payoutStatus: "pending",
          payoutRequest: request.id,
        },
        overrideAccess: true,
      });

      if (allocated.docs.length !== referralIds.length) {
        await releasePayoutReservation(context, request.id);
        return {
          error: "Your balance changed while the request was being submitted. Refresh the page and try again.",
        };
      }

      const reservedAt = new Date().toISOString();
      for (const referral of eligibleReferrals) {
        const history = referral.payoutHistory ?? [];
        await context.payload.update({
          collection: "referrals",
          id: referral.id,
          data: {
            payoutHistory: [
              ...history,
              {
                payoutRequestId: request.id,
                status: "reserved",
                amount: referral.commissionAmount,
                changedAt: reservedAt,
              },
            ],
          },
          overrideAccess: true,
        });
      }

      if (adjustmentIds.length) {
        const reservedAdjustments = await context.payload.update({
          collection: "affiliate-ledger-adjustments",
          where: {
            and: [
              { id: { in: adjustmentIds } },
              { affiliate: { equals: context.affiliate.id } },
              { status: { equals: "unapplied" } },
              { payoutRequest: { equals: null } },
            ],
          },
          limit: adjustmentIds.length,
          data: { status: "reserved", payoutRequest: request.id },
          overrideAccess: true,
        });
        if (reservedAdjustments.docs.length !== adjustmentIds.length) {
          throw new Error("An adjustment changed while the payout was being reserved.");
        }
      }
    } catch (error) {
      console.error("[Affiliate] Payout allocation failed; attempting to release the request:", error);
      try {
        await releasePayoutReservation(context, request.id);
      } catch (cleanupError) {
        console.error("[Affiliate] Payout reservation cleanup failed:", cleanupError);
        throw new Error(
          `Payout reservation cleanup needs administrator review. Request reference: #${request.id}.`,
        );
      }
      throw new Error("The payout request could not reserve its referral credits. No request was submitted.");
    }

    revalidatePath("/affiliate-dashboard");
    revalidatePath("/affiliate-dashboard/balance");
    revalidatePath("/affiliate-dashboard/payouts");
    return {
      success: "Your offline payout request was submitted for review.",
      requestId: request.id,
    };
  } catch (error) {
    console.error("[Affiliate] Payout request failed:", error);
    return {
      error: "The payout request could not be completed. Please try again.",
    };
  }
}

export async function signOutAffiliate() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("[Affiliate] Session lookup before sign out failed:", userError);
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Affiliate] Sign out failed:", error);
      return { error: "You could not be signed out. Please try again." };
    }
    return { success: true, userId: userError ? null : user?.id ?? null };
  } catch (error) {
    console.error("[Affiliate] Sign out failed:", error);
    return { error: "You could not be signed out. Please try again." };
  }
}
