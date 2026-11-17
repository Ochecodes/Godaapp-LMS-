import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

import { enforceApiRateLimit } from "@/lib/api-rate-limit";

describe("API rate-limit responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests when the shared limiter approves them", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });

    await expect(enforceApiRateLimit("user:1", 10, 60, "test")).resolves.toBeNull();
    expect(mocks.checkRateLimit).toHaveBeenCalledWith([
      { key: "user:1", limit: 10, windowSeconds: 60 },
    ]);
  });

  it("returns a retry delay when the shared limit is exceeded", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 24 });

    const response = await enforceApiRateLimit("user:1", 10, 60, "test");

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("24");
  });

  it("fails closed and logs when the shared limiter is unavailable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.checkRateLimit.mockRejectedValue(new Error("database detail"));

    const response = await enforceApiRateLimit("user:1", 10, 60, "test");

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({
      error: "This service is temporarily unavailable. Please try again shortly.",
    });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
