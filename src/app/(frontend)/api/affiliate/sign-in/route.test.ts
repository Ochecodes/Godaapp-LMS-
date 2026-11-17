// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  createClient: vi.fn(),
  findApprovedAffiliateApplication: vi.fn(),
  getClientAddress: vi.fn(),
  getPayload: vi.fn(),
  getUser: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/lib/affiliate-membership", () => ({
  findApprovedAffiliateApplication: mocks.findApprovedAffiliateApplication,
}));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));

import { POST } from "@/app/(frontend)/api/affiliate/sign-in/route";

const body = { fullName: "Alex Affiliate", email: "Alex@example.com" };

function signInRequest(requestBody: unknown, origin = "https://godaapp.example") {
  return new Request("https://godaapp.example/api/affiliate/sign-in", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });
}

describe("POST /api/affiliate/sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getPayload.mockResolvedValue({});
    mocks.findApprovedAffiliateApplication.mockResolvedValue({
      id: 1,
      fullName: "Alex Affiliate",
    });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: mocks.getUser,
        signInWithOtp: mocks.signInWithOtp,
      },
    });
  });

  it("sends a one-time Supabase link for an approved name and email", async () => {
    const response = await POST(signInRequest(body));

    expect(response.status).toBe(200);
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "alex@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://godaapp.example/affiliate/callback",
        data: { full_name: "Alex Affiliate" },
      },
    });
  });

  it("sends a fresh link even when the browser already has an affiliate session", async () => {
    mocks.getUser.mockResolvedValueOnce({
      data: {
        user: {
          email: "alex@example.com",
          email_confirmed_at: "2026-11-14T12:00:00.000Z",
        },
      },
      error: null,
    });

    const response = await POST(signInRequest(body));

    expect(response.status).toBe(200);
    expect(mocks.signInWithOtp).toHaveBeenCalledOnce();
  });

  it("does not reveal membership status or send a link for an unapproved applicant", async () => {
    mocks.findApprovedAffiliateApplication.mockResolvedValueOnce(null);
    const response = await POST(signInRequest(body));

    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("message");
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests and rate-limits attempts", async () => {
    const crossOrigin = await POST(
      signInRequest(body, "https://attacker.example"),
    );
    expect(crossOrigin.status).toBe(403);

    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 90,
    });
    const limited = await POST(signInRequest(body));
    expect(limited.status).toBe(429);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("rejects oversized JSON bodies", async () => {
    const response = await POST(
      signInRequest({ ...body, extra: "x".repeat(17_000) }),
    );

    expect(response.status).toBe(413);
    expect(mocks.findApprovedAffiliateApplication).not.toHaveBeenCalled();
  });
});
