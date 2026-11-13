import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  createClient: vi.fn(),
  getClientAddress: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { POST } from "@/app/(frontend)/api/auth/route";

function authRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/auth", {
    method: "POST",
    headers: { origin: "http://localhost:3000", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/auth", () => {
  beforeEach(() => {
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });
    mocks.createClient.mockResolvedValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signInWithOAuth: mocks.signInWithOAuth,
        signUp: mocks.signUp,
      },
    });
  });

  it("rejects missing and cross-origin requests before rate limiting", async () => {
    const missingOrigin = await POST(
      new Request("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "sign-in" }),
      }),
    );
    const crossOrigin = await POST(
      authRequest({ action: "sign-in", email: "student@example.com", password: "pass" }, {
        origin: "https://attacker.example",
      }),
    );

    expect(missingOrigin.status).toBe(403);
    expect(crossOrigin.status).toBe(403);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("rejects malformed, oversized, unsupported, or invalid credential requests", async () => {
    const malformed = await POST(authRequest("{"));
    const unsupported = await POST(authRequest({ action: "delete-account" }));
    const invalidEmail = await POST(
      authRequest({ action: "sign-in", email: "not-an-email", password: "password" }),
    );
    const shortSignupPassword = await POST(
      authRequest({
        action: "sign-up",
        email: "student@example.com",
        password: "short",
        fullName: "Student",
      }),
    );
    const oversized = await POST(
      authRequest({
        action: "sign-in",
        email: "student@example.com",
        password: "x".repeat(17_000),
      }),
    );

    expect(malformed.status).toBe(400);
    expect(unsupported.status).toBe(400);
    expect(invalidEmail.status).toBe(400);
    expect(shortSignupPassword.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("applies rate limiting before invoking Supabase Auth", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });
    const response = await POST(
      authRequest({ action: "sign-in", email: "student@example.com", password: "password" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("signs in with normalized email and valid credentials", async () => {
    const response = await POST(
      authRequest({ action: "sign-in", email: " Student@Example.com ", password: "password" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "password",
    });
  });

  it("creates an account and requires verification when Supabase returns no session", async () => {
    const response = await POST(
      authRequest({
        action: "sign-up",
        email: "student@example.com",
        password: "secure-password",
        fullName: "Student Example",
        next: "//attacker.example",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ requiresEmailVerification: true });
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "student@example.com",
        options: expect.objectContaining({
          data: { full_name: "Student Example" },
          emailRedirectTo: expect.stringContaining("next=%2Fdashboard"),
        }),
      }),
    );
  });

  it("returns a same-origin callback URL for Google OAuth", async () => {
    const response = await POST(authRequest({ action: "google", next: "/dashboard/courses" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      redirectUrl: "https://accounts.google.com/oauth",
    });
    const call = mocks.signInWithOAuth.mock.calls[0][0];
    expect(call.options.redirectTo).toContain("http://localhost:3000/callback");
    expect(call.options.redirectTo).toContain("next=%2Fdashboard%2Fcourses");
  });

  it("returns service errors without a success-shaped response", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const response = await POST(
      authRequest({ action: "sign-in", email: "student@example.com", password: "password" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid login credentials" });
  });
});
