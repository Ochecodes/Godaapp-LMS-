import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensurePayloadStudent: vi.fn(),
}));

vi.mock("@/lib/course-enrollment", () => ({
  ensurePayloadStudent: mocks.ensurePayloadStudent,
}));

import { ensureAffiliateMembership } from "@/lib/affiliate-membership";

describe("ensureAffiliateMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensurePayloadStudent.mockResolvedValue({ id: 11 });
  });

  it("creates and links an affiliate profile only for an approved application", async () => {
    const application = {
      id: 7,
      fullName: "Alex Affiliate",
      email: "alex@example.com",
      status: "approved",
      affiliate: null,
    };
    const payload = {
      find: vi.fn(async ({ collection, where }: { collection: string; where: Record<string, unknown> }) => {
        if (collection === "affiliate-applications") return { docs: [application] };
        if (where.referralCode) return { docs: [] };
        return { docs: [] };
      }),
      create: vi.fn().mockResolvedValue({
        id: 21,
        referralCode: "GODA1234",
        status: "approved",
      }),
      update: vi.fn().mockResolvedValue({ ...application, affiliate: 21 }),
    };

    const membership = await ensureAffiliateMembership(
      payload as never,
      {
        id: "supabase-user",
        email: "alex@example.com",
        user_metadata: {},
      },
    );

    expect(membership?.affiliate).toMatchObject({
      id: 21,
      status: "approved",
    });
    expect(mocks.ensurePayloadStudent).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        user_metadata: { full_name: "Alex Affiliate" },
      }),
    );
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "affiliates",
        data: expect.objectContaining({
          user: 11,
          status: "approved",
          referralCode: expect.stringMatching(/^GODA[A-F0-9]{8}$/),
        }),
      }),
    );
    expect(payload.update).toHaveBeenCalledWith({
      collection: "affiliate-applications",
      id: 7,
      data: { affiliate: 21 },
      overrideAccess: true,
    });
  });

  it("does not create a profile when membership is not approved", async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      create: vi.fn(),
      update: vi.fn(),
    };

    const membership = await ensureAffiliateMembership(
      payload as never,
      {
        id: "supabase-user",
        email: "alex@example.com",
        user_metadata: {},
      },
    );

    expect(membership).toBeNull();
    expect(mocks.ensurePayloadStudent).not.toHaveBeenCalled();
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("reactivates a suspended profile after an admin re-approves its application", async () => {
    const application = {
      id: 7,
      fullName: "Alex Affiliate",
      email: "alex@example.com",
      status: "approved",
      affiliate: 21,
    };
    const affiliate = {
      id: 21,
      referralCode: "GODA1234",
      status: "suspended",
    };
    const payload = {
      find: vi.fn(async ({ collection }: { collection: string }) => ({
        docs: collection === "affiliate-applications" ? [application] : [affiliate],
      })),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ ...affiliate, status: "approved" }),
    };

    const membership = await ensureAffiliateMembership(
      payload as never,
      {
        id: "supabase-user",
        email: "alex@example.com",
        user_metadata: {},
      },
    );

    expect(membership?.affiliate.status).toBe("approved");
    expect(payload.update).toHaveBeenCalledWith({
      collection: "affiliates",
      id: 21,
      data: { status: "approved" },
      overrideAccess: true,
    });
  });
});
