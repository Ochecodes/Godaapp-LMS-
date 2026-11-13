// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextFetchEvent } from "next/server";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
  isTinybirdConfigured: vi.fn(),
  trackTinybirdEvent: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("@/lib/tinybird/client", () => ({
  isTinybirdConfigured: mocks.isTinybirdConfigured,
  trackTinybirdEvent: mocks.trackTinybirdEvent,
}));

import { middleware } from "@/middleware";

function nextEvent() {
  return { waitUntil: vi.fn() } as unknown as NextFetchEvent;
}

describe("protected-route middleware", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_test");
    mocks.getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "verified-user-1",
          email: "student@example.com",
          email_verified: true,
          user_metadata: {
            role: "student",
            full_name: "Student Example",
            untrusted_admin_field: "must-not-forward",
          },
        },
      },
      error: null,
    });
    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      options.cookies.setAll([
        { name: "sb-session", value: "refreshed", options: { path: "/" } },
      ]);
      return { auth: { getClaims: mocks.getClaims } };
    });
  });

  it("fails closed when Supabase auth is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const response = await middleware(
      new NextRequest("https://godaapp.example/dashboard"),
      nextEvent(),
    );

    expect(response.status).toBe(503);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("redirects missing and unauthorized claims away from protected routes", async () => {
    mocks.getClaims.mockResolvedValueOnce({ data: { claims: null }, error: null });
    const signedOut = await middleware(
      new NextRequest("https://godaapp.example/dashboard"),
      nextEvent(),
    );
    expect(signedOut.status).toBe(307);
    expect(signedOut.headers.get("location")).toContain("/sign-in");

    const wrongRole = await middleware(
      new NextRequest("https://godaapp.example/affiliate-dashboard"),
      nextEvent(),
    );
    expect(wrongRole.status).toBe(307);
    expect(wrongRole.headers.get("location")).toContain("/dashboard");
  });

  it("forwards a minimal verified identity, replaces caller input, and keeps refreshed cookies", async () => {
    const request = new NextRequest("https://godaapp.example/dashboard/profile", {
      headers: { "x-goda-verified-user": '{"id":"attacker"}' },
    });
    const response = await middleware(request, nextEvent());

    const forwardedIdentity = response.headers.get(
      "x-middleware-request-x-goda-verified-user",
    );
    expect(forwardedIdentity).toBeTruthy();
    expect(JSON.parse(forwardedIdentity!)).toEqual({
      id: "verified-user-1",
      email: "student@example.com",
      user_metadata: {
        full_name: "Student Example",
      },
      email_verified: true,
    });
    expect(response.headers.get("set-cookie")).toContain("sb-session=refreshed");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-middleware-override-headers")).toContain(
      "x-goda-verified-user",
    );
  });

  it("skips authentication verification on public routes", async () => {
    const response = await middleware(
      new NextRequest("https://godaapp.example/catalog"),
      nextEvent(),
    );

    expect(response.status).toBe(200);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
