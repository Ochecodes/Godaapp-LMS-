import { describe, expect, it, vi } from "vitest";
import { AffiliateLedgerAdjustments } from "./AffiliateLedgerAdjustments";

function getValidationHook() {
  const hook = AffiliateLedgerAdjustments.hooks?.beforeChange?.[0];
  if (typeof hook !== "function") throw new Error("Missing ledger adjustment validation hook.");
  return hook;
}

function adjustmentRequest(existingAmount: number) {
  const findByID = vi.fn().mockResolvedValue({
    id: 3,
    affiliate: 7,
    commissionAmount: 20,
    payoutStatus: "paid",
    isReversed: false,
  });
  const find = vi.fn().mockResolvedValue({
    docs: existingAmount
      ? [{ id: 9, amount: existingAmount, status: "applied" }]
      : [],
  });
  return {
    req: { payload: { findByID, find } },
    find,
    findByID,
  };
}

describe("AffiliateLedgerAdjustments", () => {
  it("prevents cumulative paid-referral adjustments from exceeding the commission", async () => {
    const { req } = adjustmentRequest(15);
    const hook = getValidationHook();

    await expect(
      hook({
        operation: "create",
        data: { affiliate: 7, referral: 3, amount: 6 },
        req,
      } as never),
    ).rejects.toThrow("Total adjustments cannot exceed the referral commission.");
  });

  it("allows a paid-referral adjustment within the remaining commission", async () => {
    const { req, find, findByID } = adjustmentRequest(15);
    const hook = getValidationHook();
    const data = { affiliate: 7, referral: 3, amount: 5 };

    await expect(
      hook({ operation: "create", data, req } as never),
    ).resolves.toBe(data);
    expect(findByID).toHaveBeenCalled();
    expect(find).toHaveBeenCalled();
  });
});
