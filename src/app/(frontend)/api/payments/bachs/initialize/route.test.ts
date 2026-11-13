import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  cookies: vi.fn(),
  createBachsCheckoutSession: vi.fn(),
  createClient: vi.fn(),
  ensurePayloadStudent: vi.fn(),
  findPublishedCourseBySlug: vi.fn(),
  getClientAddress: vi.fn(),
  getPayload: vi.fn(),
  getPublicAppBaseUrl: vi.fn(),
  trackTinybirdEvent: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/course-enrollment", () => ({
  ensurePayloadStudent: mocks.ensurePayloadStudent,
  findPublishedCourseBySlug: mocks.findPublishedCourseBySlug,
}));
vi.mock("@/lib/tinybird/client", () => ({ trackTinybirdEvent: mocks.trackTinybirdEvent }));
vi.mock("@/lib/bachs/client", () => ({
  BachsApiError: class BachsApiError extends Error {
    constructor(message: string, readonly status: number, readonly code?: string) {
      super(message);
      this.name = "BachsApiError";
    }
  },
  BachsConfigurationError: class BachsConfigurationError extends Error {},
  createBachsCheckoutSession: mocks.createBachsCheckoutSession,
  getPublicAppBaseUrl: mocks.getPublicAppBaseUrl,
}));

import { POST } from "@/app/(frontend)/api/payments/bachs/initialize/route";

const course = {
  id: 17,
  slug: "investing-basics",
  title: "Investing Basics",
  priceUSD: 49.9,
};

const user = {
  id: "supabase-user-1",
  email: "student@example.com",
  user_metadata: { full_name: "Student Example" },
};

function checkoutRequest(body: unknown) {
  return new Request("https://godaapp.example/api/payments/bachs/initialize", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.12" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payments/bachs/initialize", () => {
  beforeEach(() => {
    vi.stubEnv("BACHS_API_KEY", "sk_sandbox_test");
    mocks.getClientAddress.mockReturnValue("203.0.113.12");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    });
    mocks.cookies.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "godaapp_affiliate_ref") return { value: "ref-2026" };
        if (name === "goda_visitor_id") return { value: "visitor-1" };
        return undefined;
      }),
    });
    mocks.getPayload.mockResolvedValue({});
    mocks.findPublishedCourseBySlug.mockResolvedValue(course);
    mocks.getPublicAppBaseUrl.mockReturnValue(new URL("https://godaapp.example"));
    mocks.createBachsCheckoutSession.mockResolvedValue({
      checkout_id: "checkout_123",
      checkout_url: "https://checkout.bachs.io/session/checkout_123",
    });
    mocks.trackTinybirdEvent.mockResolvedValue(undefined);
  });

  it("fails closed on missing IP, rate-limit denial, and limiter errors", async () => {
    mocks.getClientAddress.mockReturnValue(null);
    const missingIp = await POST(checkoutRequest({ course: course.slug }));
    expect(missingIp.status).toBe(400);

    mocks.getClientAddress.mockReturnValue("203.0.113.12");
    mocks.checkRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 25 });
    const limited = await POST(checkoutRequest({ course: course.slug }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("25");

    mocks.checkRateLimit.mockRejectedValueOnce(new Error("rate limiter unavailable"));
    const unavailable = await POST(checkoutRequest({ course: course.slug }));
    expect(unavailable.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("requires a signed-in user and valid course input", async () => {
    mocks.createClient.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const unauthenticated = await POST(checkoutRequest({ course: course.slug }));
    expect(unauthenticated.status).toBe(401);

    const invalidCourse = await POST(checkoutRequest({ course: "../invalid" }));
    expect(invalidCourse.status).toBe(400);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rejects missing, unpublished, and free courses", async () => {
    mocks.findPublishedCourseBySlug.mockResolvedValueOnce(null);
    const missingCourse = await POST(checkoutRequest({ course: course.slug }));
    expect(missingCourse.status).toBe(404);

    mocks.findPublishedCourseBySlug.mockResolvedValueOnce({ ...course, priceUSD: 0 });
    const freeCourse = await POST(checkoutRequest({ course: course.slug }));
    expect(freeCourse.status).toBe(409);

    expect(mocks.createBachsCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates checkout from the server's published course price and student identity", async () => {
    const response = await POST(checkoutRequest({ course: course.slug, priceUSD: 0.01 }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutUrl: "https://checkout.bachs.io/session/checkout_123",
    });
    expect(mocks.ensurePayloadStudent).toHaveBeenCalledWith({}, user);
    expect(mocks.createBachsCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "49.90",
        customerEmail: user.email,
        customerName: "Student Example",
        cancelUrl: expect.stringContaining("/enroll/continue?course=investing-basics"),
        successUrl: "https://godaapp.example/dashboard/courses?payment=processing",
        metadata: expect.objectContaining({
          course_id: "17",
          course_price_usd: "49.90",
          course_slug: "investing-basics",
          student_user_id: user.id,
          ref_code: "ref-2026",
        }),
      }),
    );
    expect(mocks.trackTinybirdEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "checkout_started", amount_usd: course.priceUSD }),
    );
  });

  it("fails safely when provider configuration or checkout creation fails", async () => {
    mocks.getPublicAppBaseUrl.mockImplementationOnce(() => {
      throw new Error("invalid return URL");
    });
    const badReturnUrl = await POST(checkoutRequest({ course: course.slug }));
    expect(badReturnUrl.status).toBe(503);

    mocks.createBachsCheckoutSession.mockRejectedValueOnce(new Error("provider offline"));
    const providerError = await POST(checkoutRequest({ course: course.slug }));
    expect(providerError.status).toBe(502);
  });
});
