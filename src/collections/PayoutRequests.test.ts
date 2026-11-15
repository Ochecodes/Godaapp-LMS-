import { describe, expect, it, vi } from "vitest";
import { PayoutRequests } from "./PayoutRequests";

function getStatusBeforeChange() {
  const statusField = PayoutRequests.fields?.find(
    (field) => "name" in field && field.name === "status",
  );
  if (!statusField || !("hooks" in statusField)) {
    throw new Error("Missing payout status validation hook.");
  }
  const hook = statusField.hooks?.beforeChange?.[0];
  if (typeof hook !== "function") throw new Error("Missing payout status validation hook.");
  return hook;
}

describe("PayoutRequests settlement", () => {
  it("prevents settled and rejected requests from reopening", async () => {
    const hook = getStatusBeforeChange();

    await expect(
      hook({
        value: "pending",
        originalDoc: { status: "approved" },
      } as never),
    ).rejects.toThrow("A settled or rejected payout request cannot be reopened.");
    await expect(
      hook({
        value: "approved",
        originalDoc: { status: "rejected" },
      } as never),
    ).rejects.toThrow("A settled or rejected payout request cannot be reopened.");
  });

  it("records the offline settlement date when staff mark a request paid", async () => {
    const hook = PayoutRequests.hooks?.beforeChange?.[0];
    if (typeof hook !== "function") throw new Error("Missing payout timestamp hook.");

    const data = await hook({
      data: { status: "approved" },
      originalDoc: { status: "pending" },
    } as never);

    expect(data).toMatchObject({ status: "approved", paidAt: expect.any(String) });
  });

  it("settles allocated referral credits when staff record an offline payment", async () => {
    const referral = {
      id: 8,
      commissionAmount: 25,
      payoutHistory: [
        {
          payoutRequestId: 31,
          status: "reserved",
          amount: 25,
          changedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    };
    const find = vi.fn().mockResolvedValue({ docs: [referral] });
    const update = vi.fn().mockResolvedValue({ docs: [] });
    const hook = PayoutRequests.hooks?.afterChange?.[0];
    if (typeof hook !== "function") throw new Error("Missing payout settlement hook.");

    await hook({
      doc: { id: 31, status: "approved" },
      previousDoc: { status: "pending" },
      req: { payload: { find, update } },
    } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "referrals",
        id: 8,
        data: expect.objectContaining({
          payoutStatus: "paid",
          payoutHistory: [
            ...referral.payoutHistory,
            expect.objectContaining({ payoutRequestId: 31, status: "paid", amount: 25 }),
          ],
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "affiliate-ledger-adjustments",
        data: { status: "applied" },
      }),
    );
  });

  it("releases allocated credits when staff reject a request", async () => {
    const referral = {
      id: 8,
      commissionAmount: 25,
      payoutHistory: [],
    };
    const find = vi.fn().mockResolvedValue({ docs: [referral] });
    const update = vi.fn().mockResolvedValue({ docs: [] });
    const hook = PayoutRequests.hooks?.afterChange?.[0];
    if (typeof hook !== "function") throw new Error("Missing payout settlement hook.");

    await hook({
      doc: { id: 31, status: "rejected" },
      previousDoc: { status: "pending" },
      req: { payload: { find, update } },
    } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "referrals",
        id: 8,
        data: expect.objectContaining({
          payoutStatus: "unpaid",
          payoutRequest: null,
          payoutHistory: [
            expect.objectContaining({ payoutRequestId: 31, status: "released", amount: 25 }),
          ],
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "affiliate-ledger-adjustments",
        data: { status: "unapplied", payoutRequest: null },
      }),
    );
  });
});
