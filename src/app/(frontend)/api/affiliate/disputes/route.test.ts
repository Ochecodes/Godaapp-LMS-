// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  createClient: vi.fn(),
  ensureAffiliateMembership: vi.fn(),
  getClientAddress: vi.fn(),
  getPayload: vi.fn(),
  hasSameOrigin: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/affiliate-membership", () => ({
  ensureAffiliateMembership: mocks.ensureAffiliateMembership,
}));
vi.mock("@/lib/request-origin", () => ({ hasSameOrigin: mocks.hasSameOrigin }));
vi.mock("@/lib/request-body", () => ({
  RequestBodyTooLargeError: class RequestBodyTooLargeError extends Error {},
  readJsonBody: async (request: Request) => request.json(),
}));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));

import { POST } from "@/app/(frontend)/api/affiliate/disputes/route";

function request(body: unknown) {
  return new Request("https://godaapp.example/api/affiliate/disputes", {
    method: "POST",
    headers: {
      origin: "https://godaapp.example",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/affiliate/disputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSameOrigin.mockReturnValue(true);
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "supabase-user",
              email: "alex@example.com",
              email_confirmed_at: "2026-01-01T00:00:00.000Z",
            },
          },
        }),
      },
    });
    mocks.ensureAffiliateMembership.mockResolvedValue({
      affiliate: { id: 21 },
      application: { fullName: "Alex Affiliate" },
    });
    mocks.getPayload.mockResolvedValue({
      create: vi.fn().mockResolvedValue({ id: 45 }),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  it("keeps the dispute record and reports email delivery failure", async () => {
    const create = vi.fn().mockResolvedValue({ id: 45 });
    mocks.getPayload.mockResolvedValue({ create });

    const response = await POST(
      request({
        subject: "Referral was not credited",
        category: "referral",
        details: "The paid checkout is missing from my referral balance.",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: 45,
      notificationSent: false,
      message: expect.stringContaining("saved"),
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "affiliate-disputes",
        data: expect.objectContaining({
          affiliate: 21,
          subject: "Referral was not credited",
          status: "submitted",
        }),
        overrideAccess: true,
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://formsubmit.co/ajax/godaappinfo@gmail.com",
      expect.objectContaining({
        body: expect.stringContaining("Affiliate dispute — GodaApp"),
      }),
    );
  });

  it("rejects cross-origin submissions before storing a dispute", async () => {
    mocks.hasSameOrigin.mockReturnValue(false);

    const response = await POST(request({
      subject: "Referral was not credited",
      category: "referral",
      details: "The paid checkout is missing from my referral balance.",
    }));

    expect(response.status).toBe(403);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });
});
