import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getPayload: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import {
  getAffiliateDashboardMetrics,
  requestAffiliateWithdrawal,
  submitAffiliateKyc,
} from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";

const payloadUser = { id: 11 };
const affiliateId = 21;
const application = {
  id: 41,
  fullName: "Alex Affiliate",
  email: "alex@example.com",
  status: "approved",
  phone: "555-0100",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

type ReferralFixture = {
  id: number;
  affiliate: number;
  course: { id: number; title: string };
  referredEmail: string;
  commissionAmount: number;
  payoutStatus: "unpaid" | "pending" | "paid";
  isReversed?: boolean;
  payoutRequest?: number | null;
  payoutHistory?: Array<{
    payoutRequestId: number;
    status: "reserved" | "released" | "paid";
    amount: number;
    changedAt: string;
  }>;
  createdAt: string;
};

type PayoutFixture = {
  id: number;
  amountRequested: number;
  status: "pending" | "approved" | "rejected";
  priorPayoutOffset?: number;
  adjustmentOffset?: number;
  createdAt: string;
};

function createForm(expectedAvailableBalance = "100") {
  const formData = new FormData();
  formData.set("expectedAvailableBalance", expectedAvailableBalance);
  formData.set("confirmDetails", "yes");
  formData.set("payoutMethod", "bank_transfer");
  formData.set("country", "United States");
  formData.set("accountName", "Alex Affiliate");
  formData.set("bankName", "Example Bank");
  formData.set("accountNumber", "1234567890");
  return formData;
}

function createKycForm(dateOfBirth: string) {
  const formData = new FormData();
  formData.set("legalName", "Alex Affiliate");
  formData.set("dateOfBirth", dateOfBirth);
  formData.set("country", "United States");
  formData.set("residentialAddress", "123 Example Street");
  formData.set("identityType", "passport");
  formData.set("identityLastFour", "1234");
  return formData;
}

function referral(
  id: number,
  commissionAmount: number,
  payoutStatus: ReferralFixture["payoutStatus"] = "unpaid",
  payoutRequest: number | null = null,
): ReferralFixture {
  return {
    id,
    affiliate: affiliateId,
    course: { id: 7, title: "Investing Basics" },
    referredEmail: "learner@example.com",
    commissionAmount,
    payoutStatus,
    payoutRequest,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function setup({
  user = { id: "supabase-user", email: "alex@example.com", email_confirmed_at: "2026-01-01" },
  hasAffiliate = true,
  affiliateStatus = "approved",
  hasApprovedMembership = true,
  referrals = [referral(1, 80), referral(2, 20)],
  payouts = [],
  adjustments = [],
  kycStatus = "verified",
}: {
  user?: { id: string; email?: string | null; email_confirmed_at?: string | null } | null;
  hasAffiliate?: boolean;
  affiliateStatus?: string;
  hasApprovedMembership?: boolean;
  referrals?: ReferralFixture[];
  payouts?: PayoutFixture[];
  adjustments?: Array<{
    id: number;
    affiliate: number;
    referral: number;
    amount: number;
    reason: "refund" | "chargeback" | "manual_correction";
    status: "unapplied";
    createdAt: string;
  }>;
  kycStatus?: string;
} = {}) {
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === "users") return { docs: [payloadUser] };
      if (collection === "affiliates") {
        return hasAffiliate
          ? { docs: [{ id: affiliateId, status: affiliateStatus }] }
          : { docs: [] };
      }
      if (collection === "affiliate-applications") {
        return { docs: hasApprovedMembership ? [application] : [] };
      }
      if (collection === "referrals") return { docs: referrals };
      if (collection === "payout-requests") return { docs: payouts };
      if (collection === "affiliate-kyc") {
        return { docs: kycStatus === "not_started" ? [] : [{ status: kycStatus }] };
      }
      if (collection === "affiliate-ledger-adjustments") return { docs: adjustments };
      return { docs: [] };
    }),
    create: vi.fn().mockResolvedValue({ id: 31 }),
    update: vi.fn(async ({ collection, where }: {
      collection: string;
      where?: { and?: Array<{ id?: { in?: number[] } }> };
    }) => {
      if (!where?.and) return { docs: [] };
      const ids = where.and.find((condition) => condition.id?.in)?.id?.in ?? [];
      if (collection === "referrals") {
        return { docs: referrals.filter((item) => ids.includes(item.id)) };
      }
      if (collection === "affiliate-ledger-adjustments") {
        return { docs: adjustments.filter((item) => ids.includes(item.id)) };
      }
      return { docs: [] };
    }),
    delete: vi.fn().mockResolvedValue({}),
  };

  mocks.getPayload.mockResolvedValue(payload);
  mocks.createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  });
  return payload;
}

describe("affiliate payout actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates available and reserved balances from the affiliate ledger", async () => {
    setup({
      payouts: [
        {
          id: 10,
          amountRequested: 30,
          status: "approved",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await expect(getAffiliateDashboardMetrics()).resolves.toEqual({
      totalReferrals: 2,
      totalEarned: 100,
      totalWithdrawn: 30,
      availableBalance: 70,
      reservedBalance: 0,
      adjustmentOffset: 0,
      accountStatus: "approved",
      kycStatus: "verified",
    });
  });

  it("requires a verified member and completed KYC before creating a payout", async () => {
    const unauthenticated = setup({ user: null });
    await expect(requestAffiliateWithdrawal({}, createForm())).resolves.toEqual({
      error: "Authentication required.",
    });
    expect(unauthenticated.create).not.toHaveBeenCalled();

    const unverified = setup({ kycStatus: "submitted" });
    await expect(requestAffiliateWithdrawal({}, createForm())).resolves.toEqual({
      error: "Complete KYC verification before requesting a payout.",
    });
    expect(unverified.create).not.toHaveBeenCalled();

    const suspended = setup({ affiliateStatus: "suspended" });
    await expect(requestAffiliateWithdrawal({}, createForm("20"))).resolves.toEqual({
      error: "Affiliate membership is not active.",
    });
    expect(suspended.create).not.toHaveBeenCalled();
  });

  it("rejects impossible dates of birth on the server", async () => {
    const payload = setup();

    await expect(
      submitAffiliateKyc({}, createKycForm("2026-02-31")),
    ).resolves.toEqual({ error: "Enter a valid date of birth." });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("creates an offline request for the server-calculated full available balance", async () => {
    const payload = setup();

    await expect(requestAffiliateWithdrawal({}, createForm())).resolves.toEqual({
      success: "Your offline payout request was submitted for review.",
      requestId: 31,
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: "payout-requests",
      data: {
        affiliate: affiliateId,
        amountRequested: 100,
        priorPayoutOffset: 0,
        adjustmentOffset: 0,
        payoutMethod: "bank_transfer",
        country: "United States",
        accountName: "Alex Affiliate",
        bankName: "Example Bank",
        accountNumber: "1234567890",
        walletAddress: null,
        network: null,
        status: "pending",
      },
      overrideAccess: true,
    });
    expect(payload.update).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/affiliate-dashboard/payouts");
  });

  it("rejects a stale confirmed balance without creating or reserving a request", async () => {
    const payload = setup();

    await expect(requestAffiliateWithdrawal({}, createForm("99"))).resolves.toEqual({
      error: "Your available balance changed. Refresh the page and review the amount before submitting.",
    });

    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("does not pay out while outstanding adjustments exceed available commissions", async () => {
    const payload = setup({
      referrals: [referral(1, 25)],
      adjustments: [
        {
          id: 8,
          affiliate: affiliateId,
          referral: 1,
          amount: 30,
          reason: "chargeback",
          status: "unapplied",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    await expect(requestAffiliateWithdrawal({}, createForm("0"))).resolves.toEqual({
      error: "There is no available balance to request right now.",
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("applies covered refund adjustments before calculating the offline payout", async () => {
    const payload = setup({
      referrals: [referral(1, 100)],
      adjustments: [
        {
          id: 8,
          affiliate: affiliateId,
          referral: 1,
          amount: 30,
          reason: "refund",
          status: "unapplied",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    await expect(requestAffiliateWithdrawal({}, createForm("70"))).resolves.toEqual({
      success: "Your offline payout request was submitted for review.",
      requestId: 31,
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountRequested: 70,
          adjustmentOffset: 30,
        }),
      }),
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "affiliate-ledger-adjustments",
        data: { status: "reserved", payoutRequest: 31 },
      }),
    );
  });

  it("allows a new request for later credits while an earlier request is pending", async () => {
    const payload = setup({
      referrals: [
        referral(1, 80, "pending", 55),
        referral(2, 20),
      ],
      payouts: [
        {
          id: 55,
          amountRequested: 80,
          status: "pending",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await expect(requestAffiliateWithdrawal({}, createForm())).resolves.toEqual({
      success: "Your offline payout request was submitted for review.",
      requestId: 31,
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountRequested: 20 }),
      }),
    );
  });
});
