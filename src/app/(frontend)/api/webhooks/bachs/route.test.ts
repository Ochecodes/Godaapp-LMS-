import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceApiRateLimit: vi.fn(),
  getClientAddress: vi.fn(),
  findPublishedCourseBySlug: vi.fn(),
  getPayload: vi.fn(),
  payloadCreate: vi.fn(),
  payloadFind: vi.fn(),
  payloadUpdate: vi.fn(),
  trackTinybirdEvent: vi.fn(),
}));

vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));
vi.mock("@/lib/course-enrollment", () => ({
  findPublishedCourseBySlug: mocks.findPublishedCourseBySlug,
}));
vi.mock("@/lib/tinybird/client", () => ({
  trackTinybirdEvent: mocks.trackTinybirdEvent,
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/api-rate-limit", () => ({
  enforceApiRateLimit: mocks.enforceApiRateLimit,
}));

import { POST } from "@/app/(frontend)/api/webhooks/bachs/route";

const secret = "test-webhook-secret";
const course = { id: 7, slug: "investing-basics" };
const event = {
  type: "checkout.completed",
  data: {
    amount: "49.99",
    checkout_id: "checkout_123",
    currency: "USD",
    customer: { email: "student@example.com" },
    metadata: {
      course_id: "7",
      course_price_usd: "49.99",
      course_slug: "investing-basics",
      student_user_id: "supabase-user-1",
    },
    payment_status: "paid",
    status: "completed",
  },
};

function signedRequest(rawBody: string, timestamp = String(Math.floor(Date.now() / 1000))) {
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return new Request("https://godaapp.example/api/webhooks/bachs", {
    method: "POST",
    headers: {
      "x-bachs-signature-v2": `t=${timestamp},v1=${signature}`,
    },
    body: rawBody,
  });
}

describe("POST /api/webhooks/bachs", () => {
  beforeEach(() => {
    vi.stubEnv("BACHS_WEBHOOK_SECRET", secret);
    mocks.getClientAddress.mockReturnValue("203.0.113.20");
    mocks.enforceApiRateLimit.mockResolvedValue(null);
    mocks.findPublishedCourseBySlug.mockResolvedValue(course);
    mocks.getPayload.mockResolvedValue({
      create: mocks.payloadCreate,
      find: mocks.payloadFind,
      update: mocks.payloadUpdate,
    });
    mocks.payloadFind.mockReset();
    mocks.payloadFind.mockResolvedValueOnce({
      docs: [{ id: 2, email: "student@example.com" }],
    });
    mocks.payloadFind.mockResolvedValueOnce({ docs: [] });
    mocks.payloadCreate.mockResolvedValue({ id: 3 });
    mocks.payloadUpdate.mockResolvedValue({ id: 3 });
    mocks.trackTinybirdEvent.mockResolvedValue(undefined);
  });

  it("fails closed when no signing secret is configured", async () => {
    vi.stubEnv("BACHS_WEBHOOK_SECRET", "");
    const response = await POST(signedRequest(JSON.stringify(event)));
    expect(response.status).toBe(503);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rejects missing, invalid, and stale signatures", async () => {
    const unsigned = await POST(
      new Request("https://godaapp.example/api/webhooks/bachs", {
        method: "POST",
        body: JSON.stringify(event),
      }),
    );
    const invalid = await POST(
      new Request("https://godaapp.example/api/webhooks/bachs", {
        method: "POST",
        headers: { "x-bachs-signature-v2": "t=1,v1=invalid" },
        body: JSON.stringify(event),
      }),
    );
    const stale = await POST(
      signedRequest(JSON.stringify(event), String(Math.floor(Date.now() / 1000) - 301)),
    );

    expect(unsigned.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(stale.status).toBe(401);
    expect(mocks.enforceApiRateLimit).not.toHaveBeenCalled();
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("stops a signed webhook when its IP rate limit is exhausted", async () => {
    const limited = Response.json({ error: "Too many requests." }, { status: 429 });
    mocks.enforceApiRateLimit.mockResolvedValueOnce(limited);

    const response = await POST(signedRequest(JSON.stringify(event)));

    expect(response.status).toBe(429);
    expect(mocks.enforceApiRateLimit).toHaveBeenCalledWith(
      "bachs-webhook:ip:203.0.113.20",
      1200,
      60 * 60,
      "Bachs webhook",
    );
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rejects signed invalid JSON and incomplete payment metadata", async () => {
    const invalidJson = await POST(signedRequest("{"));
    const invalidPayment = await POST(
      signedRequest(
        JSON.stringify({
          ...event,
          data: { ...event.data, amount: "50.00" },
        }),
      ),
    );

    expect(invalidJson.status).toBe(400);
    expect(invalidPayment.status).toBe(400);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("acknowledges non-completion and unpaid events without activating enrollment", async () => {
    const irrelevantEvent = await POST(
      signedRequest(JSON.stringify({ type: "checkout.created", data: {} })),
    );
    const unpaidEvent = await POST(
      signedRequest(JSON.stringify({
        ...event,
        data: { ...event.data, payment_status: "pending" },
      })),
    );

    expect(irrelevantEvent.status).toBe(200);
    expect(unpaidEvent.status).toBe(200);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("activates a matching student's enrollment only after a paid signed event", async () => {
    const response = await POST(signedRequest(JSON.stringify(event)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.findPublishedCourseBySlug).toHaveBeenCalledWith(
      expect.anything(),
      "investing-basics",
    );
    expect(mocks.payloadCreate).toHaveBeenCalledWith({
      collection: "enrollments",
      data: {
        email: "student@example.com",
        user: 2,
        course: 7,
        isActive: true,
        providerCheckoutId: "checkout_123",
      },
      overrideAccess: true,
    });
    expect(mocks.trackTinybirdEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "payment_succeeded",
        event_id: "checkout_123",
        amount_usd: 49.99,
      }),
    );
  });

  it("does not create duplicate active enrollments", async () => {
    mocks.payloadFind.mockReset();
    mocks.payloadFind.mockResolvedValueOnce({
      docs: [{ id: 2, email: "student@example.com" }],
    });
    mocks.payloadFind.mockResolvedValueOnce({ docs: [{ id: 3, isActive: true }] });

    const response = await POST(signedRequest(JSON.stringify(event)));

    expect(response.status).toBe(200);
    expect(mocks.payloadCreate).not.toHaveBeenCalled();
    expect(mocks.payloadUpdate).not.toHaveBeenCalled();
  });

  it("reactivates an existing inactive enrollment", async () => {
    mocks.payloadFind.mockReset();
    mocks.payloadFind.mockResolvedValueOnce({
      docs: [{ id: 2, email: "student@example.com" }],
    });
    mocks.payloadFind.mockResolvedValueOnce({ docs: [{ id: 3, isActive: false }] });

    const response = await POST(signedRequest(JSON.stringify(event)));

    expect(response.status).toBe(200);
    expect(mocks.payloadUpdate).toHaveBeenCalledWith({
      collection: "enrollments",
      id: 3,
      data: {
        email: "student@example.com",
        user: 2,
        isActive: true,
        providerCheckoutId: "checkout_123",
      },
      overrideAccess: true,
    });
  });

  it("creates a commission only when the referral belongs to an approved membership", async () => {
    const referredEvent = {
      ...event,
      data: {
        ...event.data,
        metadata: { ...event.data.metadata, ref_code: "GODA1234" },
      },
    };
    mocks.payloadFind.mockReset();
    mocks.payloadFind
      .mockResolvedValueOnce({ docs: [{ id: 2, email: "student@example.com" }] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 9, status: "approved" }] })
      .mockResolvedValueOnce({ docs: [{ id: 10, status: "approved" }] })
      .mockResolvedValueOnce({ docs: [] });

    const response = await POST(signedRequest(JSON.stringify(referredEvent)));

    expect(response.status).toBe(200);
    expect(mocks.payloadCreate).toHaveBeenCalledWith({
      collection: "referrals",
      data: {
        affiliate: 9,
        course: 7,
        referredEmail: "student@example.com",
        saleAmount: 49.99,
        commissionRate: 0.25,
        commissionAmount: 12.5,
        providerCheckoutId: "checkout_123",
        isReversed: false,
        payoutStatus: "unpaid",
      },
      overrideAccess: true,
    });
  });

  it("does not create a second commission for a checkout already in the ledger", async () => {
    const referredEvent = {
      ...event,
      data: {
        ...event.data,
        metadata: { ...event.data.metadata, ref_code: "GODA1234" },
      },
    };
    mocks.payloadFind.mockReset();
    mocks.payloadFind
      .mockResolvedValueOnce({ docs: [{ id: 2, email: "student@example.com" }] })
      .mockResolvedValueOnce({ docs: [{ id: 3, isActive: true }] })
      .mockResolvedValueOnce({ docs: [{ id: 9, status: "approved" }] })
      .mockResolvedValueOnce({ docs: [{ id: 10, status: "approved" }] })
      .mockResolvedValueOnce({ docs: [{ id: 11, providerCheckoutId: "checkout_123" }] });

    const response = await POST(signedRequest(JSON.stringify(referredEvent)));

    expect(response.status).toBe(200);
    expect(mocks.payloadCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "referrals" }),
    );
  });

  it("does not create a commission when the affiliate membership is no longer approved", async () => {
    const referredEvent = {
      ...event,
      data: {
        ...event.data,
        metadata: { ...event.data.metadata, ref_code: "GODA1234" },
      },
    };
    mocks.payloadFind.mockReset();
    mocks.payloadFind
      .mockResolvedValueOnce({ docs: [{ id: 2, email: "student@example.com" }] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 9, status: "approved" }] })
      .mockResolvedValueOnce({ docs: [] });

    const response = await POST(signedRequest(JSON.stringify(referredEvent)));

    expect(response.status).toBe(200);
    expect(mocks.payloadCreate).toHaveBeenCalledTimes(1);
    expect(mocks.payloadCreate).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "enrollments" }),
    );
    expect(mocks.payloadCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "referrals" }),
    );
  });
});
