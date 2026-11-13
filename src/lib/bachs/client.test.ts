import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BachsApiError,
  BachsConfigurationError,
  createBachsCheckoutSession,
  getPublicAppBaseUrl,
} from "@/lib/bachs/client";

const checkoutInput = {
  amount: "49.99",
  cancelUrl: "https://godaapp.com/enroll/continue",
  customerEmail: "student@example.com",
  metadata: { course_id: "12" },
  reference: "goda_test-reference",
  successUrl: "https://godaapp.com/dashboard",
};

describe("Bachs checkout client", () => {
  beforeEach(() => {
    vi.stubEnv("APP_BASE_URL", "https://godaapp.com");
    vi.stubEnv("BACHS_API_KEY", "sk_sandbox_test");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("accepts only public HTTPS app return URLs", () => {
    expect(getPublicAppBaseUrl().origin).toBe("https://godaapp.com");

    vi.stubEnv("APP_BASE_URL", "http://godaapp.com");
    expect(() => getPublicAppBaseUrl()).toThrow(BachsConfigurationError);
    vi.stubEnv("APP_BASE_URL", "https://192.168.1.20");
    expect(() => getPublicAppBaseUrl()).toThrow(BachsConfigurationError);
    vi.stubEnv("APP_BASE_URL", "https://user:pass@godaapp.example");
    expect(() => getPublicAppBaseUrl()).toThrow(BachsConfigurationError);
    vi.stubEnv("APP_BASE_URL", "");
    expect(() => getPublicAppBaseUrl()).toThrow(BachsConfigurationError);
  });

  it("creates a sandbox session with an idempotency key and USD decimal amount", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          checkout_id: "checkout_123",
          checkout_url: "https://checkout.bachs.io/session/checkout_123",
        }),
        { status: 201 },
      ),
    );

    await expect(createBachsCheckoutSession(checkoutInput)).resolves.toEqual({
      checkout_id: "checkout_123",
      checkout_url: "https://checkout.bachs.io/session/checkout_123",
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://sandbox-api.bachs.io/v1/checkout-sessions");
    expect(options?.headers).toMatchObject({
      "Idempotency-Key": checkoutInput.reference,
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      pricing: { amount: "49.99", currency: "USD" },
      reference: checkoutInput.reference,
      customer: { email: checkoutInput.customerEmail },
    });
  });

  it("selects the live endpoint for live keys", async () => {
    vi.stubEnv("BACHS_API_KEY", "sk_live_test");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          checkout_id: "checkout_live",
          checkout_url: "https://checkout.bachs.io/session/checkout_live",
        }),
        { status: 201 },
      ),
    );

    await createBachsCheckoutSession(checkoutInput);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://api.bachs.io/v1/checkout-sessions");
  });

  it("rejects missing and malformed provider keys before making a request", async () => {
    vi.stubEnv("BACHS_API_KEY", "");
    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toThrow(BachsConfigurationError);
    vi.stubEnv("BACHS_API_KEY", "not-a-bachs-key");
    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toThrow(BachsConfigurationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves provider error status and code", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error_code: "invalid_amount", detail: "Amount rejected" }), {
        status: 422,
      }),
    );

    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toMatchObject({
      name: "BachsApiError",
      status: 422,
      code: "invalid_amount",
    } satisfies Partial<BachsApiError>);
  });

  it("rejects malformed, incomplete, and unexpected checkout responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toThrow(
      "unreadable checkout response",
    );

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ checkout_id: "missing-url" }), { status: 200 }),
    );
    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toThrow(
      "incomplete checkout session",
    );

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ checkout_id: "unsafe", checkout_url: "https://attacker.example/pay" }),
        { status: 200 },
      ),
    );
    await expect(createBachsCheckoutSession(checkoutInput)).rejects.toThrow(
      "unexpected checkout URL",
    );
  });
});
