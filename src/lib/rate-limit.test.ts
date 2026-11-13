import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  getSupabaseSecretKey: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
  getSupabaseSecretKey: mocks.getSupabaseSecretKey,
}));

import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

describe("client address extraction", () => {
  it("uses a valid real IP before forwarded addresses", () => {
    const request = new Request("https://godaapp.example", {
      headers: {
        "x-real-ip": "203.0.113.8",
        "x-forwarded-for": "198.51.100.4, 192.0.2.9",
      },
    });
    expect(getClientAddress(request)).toBe("203.0.113.8");
  });

  it("uses the rightmost valid proxy address from x-forwarded-for", () => {
    const request = new Request("https://godaapp.example", {
      headers: { "x-forwarded-for": "198.51.100.4, 192.0.2.9" },
    });
    expect(getClientAddress(request)).toBe("192.0.2.9");
  });

  it("does not invent a production client address when proxy headers are missing or invalid", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getClientAddress(new Request("https://godaapp.example"))).toBeNull();
    expect(
      getClientAddress(
        new Request("https://godaapp.example", {
          headers: { "x-forwarded-for": "attacker-controlled" },
        }),
      ),
    ).toBeNull();
  });

  it("uses localhost as a development fallback", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getClientAddress(new Request("http://localhost:3000"))).toBe("127.0.0.1");
  });
});

describe("rate-limit checks", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.getSupabaseSecretKey.mockReturnValue("sb_secret_test");
    mocks.rpc.mockReset();
    mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("rejects empty, excessive, or malformed rules", async () => {
    await expect(checkRateLimit([])).rejects.toThrow("between one and four rules");
    await expect(
      checkRateLimit([{ key: "missing-limit", limit: 0, windowSeconds: 30 }]),
    ).rejects.toThrow("invalid values");
    await expect(
      checkRateLimit([
        { key: "", limit: 1, windowSeconds: 30 },
        { key: "two", limit: 1, windowSeconds: 30 },
        { key: "three", limit: 1, windowSeconds: 30 },
        { key: "four", limit: 1, windowSeconds: 30 },
        { key: "five", limit: 1, windowSeconds: 30 },
      ]),
    ).rejects.toThrow("between one and four rules");
  });

  it("allows requests up to the local development limit and blocks further attempts", async () => {
    const rule = { key: "test-local-limit-1", limit: 2, windowSeconds: 30 };

    await expect(checkRateLimit([rule])).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    await expect(checkRateLimit([rule])).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 0,
    });
    const limited = await checkRateLimit([rule]);
    expect(limited.allowed).toBe(false);
    expect(limited.retryAfterSeconds).toBeGreaterThan(0);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("resets a development bucket at its window boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const rule = { key: "test-local-expiry-1", limit: 1, windowSeconds: 5 };
    await checkRateLimit([rule]);
    await expect(checkRateLimit([rule])).resolves.toMatchObject({ allowed: false });

    vi.advanceTimersByTime(5000);
    await expect(checkRateLimit([rule])).resolves.toMatchObject({ allowed: true });
    vi.useRealTimers();
  });

  it("delegates production rules to the atomic database RPC using hashed keys", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 24 }],
      error: null,
    });

    await expect(
      checkRateLimit([
        { key: "auth:ip:203.0.113.1", limit: 5, windowSeconds: 60 },
        { key: "auth:email:user@example.com", limit: 2, windowSeconds: 60 },
      ]),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 24 });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "consume_app_rate_limits",
      expect.objectContaining({
        p_key_hashes: expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/)]),
        p_limits: [5, 2],
        p_window_seconds: [60, 60],
      }),
    );
  });

  it("fails explicitly when the production key, RPC, or RPC response is invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.getSupabaseSecretKey.mockImplementation(() => {
      throw new Error("SUPABASE_SECRET_KEY is required.");
    });
    await expect(
      checkRateLimit([{ key: "prod-missing-key", limit: 1, windowSeconds: 10 }]),
    ).rejects.toThrow("SUPABASE_SECRET_KEY is required");

    mocks.getSupabaseSecretKey.mockReturnValue("sb_secret_test");
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "RPC unavailable" } });
    await expect(
      checkRateLimit([{ key: "prod-rpc-error", limit: 1, windowSeconds: 10 }]),
    ).rejects.toThrow("RPC unavailable");

    mocks.rpc.mockResolvedValue({ data: [], error: null });
    await expect(
      checkRateLimit([{ key: "prod-invalid-result", limit: 1, windowSeconds: 10 }]),
    ).rejects.toThrow("invalid response");
  });
});
