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

import {
  getAffiliateDashboardMetrics,
  requestAffiliateWithdrawal,
} from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";

const payloadUser = { id: 11 };
const affiliate = { id: 21, status: "approved" };

function createForm(amount: string) {
  const formData = new FormData();
  formData.set("amount", amount);
  return formData;
}

function setup({
  user = { id: "supabase-user" },
  hasAffiliate = true,
  affiliateStatus = "approved",
  commissions = [80, 20],
  payouts = [30],
}: {
  user?: { id: string } | null;
  hasAffiliate?: boolean;
  affiliateStatus?: string;
  commissions?: number[];
  payouts?: number[];
} = {}) {
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === "users") return { docs: [payloadUser] };
      if (collection === "affiliates") {
        return hasAffiliate ? { docs: [{ ...affiliate, status: affiliateStatus }] } : { docs: [] };
      }
      if (collection === "referrals") {
        return { docs: commissions.map((commissionAmount) => ({ commissionAmount })) };
      }
      if (collection === "payout-requests") {
        return { docs: payouts.map((amountRequested) => ({ amountRequested })) };
      }
      return { docs: [] };
    }),
    create: vi.fn().mockResolvedValue({ id: 31 }),
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

  it("calculates affiliate earnings and available balance from the server ledger", async () => {
    setup();

    await expect(getAffiliateDashboardMetrics()).resolves.toEqual({
      totalReferrals: 2,
      totalEarned: 100,
      totalWithdrawn: 30,
      availableBalance: 70,
      accountStatus: "approved",
    });
  });

  it("returns an empty pending account when no affiliate profile exists", async () => {
    setup({ hasAffiliate: false });

    await expect(getAffiliateDashboardMetrics()).resolves.toEqual({
      totalReferrals: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      accountStatus: "pending",
    });
  });

  it("requires authentication and an approved affiliate profile before withdrawal", async () => {
    const unauthenticatedPayload = setup({ user: null });
    await expect(requestAffiliateWithdrawal(createForm("10"))).resolves.toEqual({
      success: false,
      error: "Authorization required.",
    });
    expect(unauthenticatedPayload.create).not.toHaveBeenCalled();

    const pendingPayload = setup({ affiliateStatus: "pending" });
    await expect(requestAffiliateWithdrawal(createForm("10"))).resolves.toEqual({
      success: false,
      error: "Withdrawal locked. Account state must be active.",
    });
    expect(pendingPayload.create).not.toHaveBeenCalled();
  });

  it("rejects malformed, non-positive, and over-balance withdrawal requests", async () => {
    const malformedPayload = setup();
    await expect(requestAffiliateWithdrawal(createForm("10abc"))).resolves.toEqual({
      success: false,
      error: "Invalid monetary value specified.",
    });
    expect(malformedPayload.create).not.toHaveBeenCalled();

    const zeroPayload = setup();
    await expect(requestAffiliateWithdrawal(createForm("0"))).resolves.toEqual({
      success: false,
      error: "Invalid monetary value specified.",
    });
    expect(zeroPayload.create).not.toHaveBeenCalled();

    const insufficientPayload = setup({ payouts: [95] });
    await expect(requestAffiliateWithdrawal(createForm("10"))).resolves.toEqual({
      success: false,
      error: "Insufficient available ledger funds.",
    });
    expect(insufficientPayload.create).not.toHaveBeenCalled();
  });

  it("creates an approved affiliate payout request within the available balance", async () => {
    const payload = setup();

    await expect(requestAffiliateWithdrawal(createForm("50.25"))).resolves.toEqual({
      success: true,
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: "payout-requests",
      data: { affiliate: affiliate.id, amountRequested: 50.25, status: "pending" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/affiliate-dashboard");
  });
});
