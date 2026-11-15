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

import { POST } from "@/app/(frontend)/api/affiliate/applications/route";

const validBody = {
  fullName: "Alex Affiliate",
  email: "Alex@example.com",
  phone: "+1 555 555 0100",
  message: "I would like to promote GodaApp courses.",
  termsAccepted: true,
};

function applicationRequest(body: unknown, origin = "https://godaapp.example") {
  return new Request("https://godaapp.example/api/affiliate/applications", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/affiliate/applications", () => {
  const find = vi.fn();
  const create = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    find.mockResolvedValue({ docs: [] });
    create.mockResolvedValue({ id: 1 });
    mocks.getPayload.mockResolvedValue({ find, create });
  });

  it("persists a normalized pending application", async () => {
    const response = await POST(applicationRequest(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "Your application was received and is awaiting review.",
    });
    expect(create).toHaveBeenCalledWith({
      collection: "affiliate-applications",
      data: {
        fullName: "Alex Affiliate",
        email: "alex@example.com",
        phone: "+1 555 555 0100",
        message: "I would like to promote GodaApp courses.",
        status: "pending",
        termsAcceptedAt: expect.any(String),
      },
      overrideAccess: true,
    });
  });

  it("rejects cross-origin and invalid submissions before writing", async () => {
    const crossOrigin = await POST(applicationRequest(validBody, "https://attacker.example"));
    const invalid = await POST(
      applicationRequest({ ...validBody, termsAccepted: false }),
    );

    expect(crossOrigin.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an oversized body even when content-length is omitted", async () => {
    const response = await POST(
      applicationRequest({ ...validBody, message: "x".repeat(17_000) }),
    );

    expect(response.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("applies rate limits and prevents duplicate applications", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
    });
    const limited = await POST(applicationRequest(validBody));
    expect(limited.status).toBe(429);

    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: true,
      retryAfterSeconds: 0,
    });
    find.mockResolvedValueOnce({ docs: [{ id: 2 }] });
    const duplicate = await POST(applicationRequest(validBody));

    expect(duplicate.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
  });
});
