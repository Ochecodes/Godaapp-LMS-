import { beforeEach, describe, expect, it, vi } from "vitest";
import { AffiliateApplications } from "./AffiliateApplications";

beforeEach(() => {
  vi.stubEnv("APP_BASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
});

describe("AffiliateApplications access synchronization", () => {
  it("suspends a linked affiliate when an application is no longer approved", async () => {
    const update = vi.fn().mockResolvedValue({ id: 22 });
    const req = { payload: { update } };
    const hook = AffiliateApplications.hooks?.afterChange?.[0];
    if (typeof hook !== "function") throw new Error("Missing membership status hook.");

    await hook({
      doc: { id: 3, affiliate: { id: 22 }, status: "revoked" },
      req,
    } as never);

    expect(update).toHaveBeenCalledWith({
      collection: "affiliates",
      id: 22,
      data: { status: "suspended" },
      req,
      overrideAccess: true,
    });
  });

  it("reactivates a linked affiliate when an application is approved again", async () => {
    const update = vi.fn().mockResolvedValue({ id: 22 });
    const req = { payload: { update } };
    const hook = AffiliateApplications.hooks?.afterChange?.[0];
    if (typeof hook !== "function") throw new Error("Missing membership status hook.");

    await hook({
      doc: { id: 3, affiliate: 22, status: "approved" },
      req,
    } as never);

    expect(update).toHaveBeenCalledWith({
      collection: "affiliates",
      id: 22,
      data: { status: "approved" },
      req,
      overrideAccess: true,
    });
    expect(update).toHaveBeenCalledWith({
      collection: "affiliate-applications",
      id: 3,
      data: { approvalNotificationStatus: "failed" },
      req,
      overrideAccess: true,
    });
  });

  it("suspends the linked affiliate when an application is deleted", async () => {
    const update = vi.fn().mockResolvedValue({ id: 22 });
    const req = { payload: { update } };
    const hook = AffiliateApplications.hooks?.afterDelete?.[0];
    if (typeof hook !== "function") throw new Error("Missing membership deletion hook.");

    await hook({
      doc: { id: 3, affiliate: { id: 22 } },
      req,
    } as never);

    expect(update).toHaveBeenCalledWith({
      collection: "affiliates",
      id: 22,
      data: { status: "suspended" },
      req,
      overrideAccess: true,
    });
  });
});
