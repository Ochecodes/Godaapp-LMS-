// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  enforceApiRateLimit: vi.fn(),
  ensureAffiliateMembership: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getPayload: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  getClientAddress: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/api-rate-limit", () => ({
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/affiliate-membership", () => ({
  ensureAffiliateMembership: mocks.ensureAffiliateMembership,
}));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));

import { GET } from "@/app/(frontend)/(affiliate-portal)/affiliate/callback/route";

function callbackRequest(query = "?code=valid-code") {
  return new Request(`https://godaapp.example/affiliate/callback${query}`);
}

describe("GET /affiliate/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "supabase-user",
          email: "alex@example.com",
          email_confirmed_at: "2026-11-14T12:00:00.000Z",
          user_metadata: { full_name: "Alex Affiliate" },
        },
      },
      error: null,
    });
    mocks.ensureAffiliateMembership.mockResolvedValue({
      application: { id: 1 },
      affiliate: { id: 2 },
    });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mocks.exchangeCodeForSession,
        getUser: mocks.getUser,
        signOut: mocks.signOut,
      },
    });
    mocks.getPayload.mockResolvedValue({});
  });

  it("rechecks approved membership after verifying the Supabase session", async () => {
    const response = await GET(callbackRequest());

    expect(response.headers.get("location")).toBe(
      "https://godaapp.example/affiliate-dashboard",
    );
    expect(mocks.ensureAffiliateMembership).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ email: "alex@example.com" }),
    );
  });

  it("signs out users whose membership is no longer approved", async () => {
    mocks.ensureAffiliateMembership.mockResolvedValueOnce(null);
    const response = await GET(callbackRequest());

    expect(response.headers.get("location")).toContain(
      "/affiliate/sign-in?error=access",
    );
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("rejects invalid codes and unsafe destination paths", async () => {
    const missingCode = await GET(callbackRequest(""));
    expect(missingCode.headers.get("location")).toContain(
      "/affiliate/sign-in?error=verification",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();

    const unsafeNext = await GET(
      callbackRequest("?code=valid-code&next=https%3A%2F%2Fattacker.example"),
    );
    expect(unsafeNext.headers.get("location")).toBe(
      "https://godaapp.example/affiliate-dashboard",
    );
  });
});
