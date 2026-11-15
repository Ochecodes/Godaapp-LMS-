// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getClientAddress: vi.fn(),
  getPayload: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));

import { GET } from "@/app/(frontend)/api/affiliate/referral/route";

function referralRequest(code: string, next = "/catalog?category=design") {
  const url = new URL("https://godaapp.example/api/affiliate/referral");
  url.searchParams.set("code", code);
  url.searchParams.set("next", next);
  return new Request(url);
}

describe("GET /api/affiliate/referral", () => {
  const find = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.checkRateLimit.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    find.mockResolvedValueOnce({ docs: [{ id: 8, referralCode: "GODA1234" }] });
    find.mockResolvedValueOnce({ docs: [{ id: 3 }] });
    mocks.getPayload.mockResolvedValue({ find });
  });

  it("replaces the attribution cookie only for an active approved member", async () => {
    const response = await GET(referralRequest("goda1234"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://godaapp.example/catalog?category=design",
    );
    expect(response.headers.get("set-cookie")).toContain("godaapp_affiliate_ref=GODA1234");
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: "affiliate-applications",
        where: {
          and: [
            { affiliate: { equals: 8 } },
            { status: { equals: "approved" } },
          ],
        },
      }),
    );
  });

  it("does not replace a prior attribution for an invalid referral", async () => {
    const response = await GET(referralRequest("bad-code"));

    expect(response.headers.get("location")).toBe(
      "https://godaapp.example/catalog?category=design",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("does not set attribution after membership was revoked", async () => {
    find.mockReset();
    find.mockResolvedValueOnce({ docs: [{ id: 8, referralCode: "GODA1234" }] });
    find.mockResolvedValueOnce({ docs: [] });
    const response = await GET(referralRequest("GODA1234"));

    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
