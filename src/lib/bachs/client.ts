type CreateCheckoutSessionInput = {
  amount: string;
  cancelUrl: string;
  customerEmail: string;
  customerName?: string;
  metadata: Record<string, string>;
  reference: string;
  successUrl: string;
};

type BachsCheckoutSession = {
  checkout_id: string;
  checkout_url: string;
};

type BachsCheckoutResponse = Partial<BachsCheckoutSession> & {
  detail?: string;
  error_code?: string;
  message?: string;
  error?: string | { message?: string };
};

export class BachsConfigurationError extends Error {}

export class BachsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "BachsApiError";
  }
}

function getApiBaseUrl(apiKey: string): string {
  if (apiKey.startsWith("sk_sandbox_")) return "https://sandbox-api.bachs.io";
  if (apiKey.startsWith("sk_live_")) return "https://api.bachs.io";
  throw new BachsConfigurationError("BACHS_API_KEY must be a Bachs sandbox or live secret key.");
}

export function getPublicAppBaseUrl(): URL {
  const configuredUrl = process.env.APP_BASE_URL;
  if (!configuredUrl) {
    throw new BachsConfigurationError(
      "APP_BASE_URL must be set to a publicly reachable HTTPS URL because Bachs does not accept localhost return URLs.",
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new BachsConfigurationError("APP_BASE_URL must be a valid publicly reachable HTTPS URL.");
  }

  const hostname = baseUrl.hostname.toLowerCase();
  const hostnameWithoutBrackets = hostname.replace(/^\[|\]$/g, "");
  const ipv4Octets = hostnameWithoutBrackets.split(".").map(Number);
  const isIpv4 =
    ipv4Octets.length === 4 &&
    ipv4Octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255);
  const isPrivateIpv4 =
    isIpv4 &&
    (ipv4Octets[0] === 0 ||
      ipv4Octets[0] === 10 ||
      ipv4Octets[0] === 127 ||
      (ipv4Octets[0] === 169 && ipv4Octets[1] === 254) ||
      (ipv4Octets[0] === 172 && ipv4Octets[1] >= 16 && ipv4Octets[1] <= 31) ||
      (ipv4Octets[0] === 192 && ipv4Octets[1] === 168));
  const isLocalHost =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".example") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostnameWithoutBrackets === "::1" ||
    hostname === "0.0.0.0";
  if (
    baseUrl.protocol !== "https:" ||
    isLocalHost ||
    isPrivateIpv4 ||
    (isIpv4 && (ipv4Octets[0] === 0 || ipv4Octets[0] >= 224)) ||
    baseUrl.username ||
    baseUrl.password
  ) {
    throw new BachsConfigurationError(
      "APP_BASE_URL must be a publicly reachable HTTPS URL. Localhost is not accepted by Bachs.",
    );
  }

  return baseUrl;
}

function getProviderErrorMessage(response: BachsCheckoutResponse): string {
  if (typeof response.detail === "string") return response.detail;
  if (typeof response.message === "string") return response.message;
  if (typeof response.error === "string") return response.error;
  if (response.error && typeof response.error.message === "string") return response.error.message;
  return "The provider returned an unsuccessful response.";
}

export async function createBachsCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<BachsCheckoutSession> {
  const apiKey = process.env.BACHS_API_KEY;
  if (!apiKey) throw new BachsConfigurationError("BACHS_API_KEY is not configured.");

  const response = await fetch(`${getApiBaseUrl(apiKey)}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.reference,
    },
    body: JSON.stringify({
      cancel_url: input.cancelUrl,
      customer: {
        email: input.customerEmail,
        ...(input.customerName ? { name: input.customerName } : {}),
      },
      metadata: input.metadata,
      pricing: { amount: input.amount, currency: "USD" },
      reference: input.reference,
      success_url: input.successUrl,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();
  let result: BachsCheckoutResponse = {};
  try {
    result = JSON.parse(responseText) as BachsCheckoutResponse;
  } catch {
    if (response.ok) throw new Error("Bachs returned an unreadable checkout response.");
  }
  if (!response.ok) {
    const code = typeof result.error_code === "string" ? result.error_code : undefined;
    const errorMessage = getProviderErrorMessage(result);
    throw new BachsApiError(
      `Bachs rejected the checkout${code ? ` (${code})` : ""}: ${errorMessage}`,
      response.status,
      code,
    );
  }
  if (!result.checkout_id || !result.checkout_url) {
    throw new Error("Bachs returned an incomplete checkout session.");
  }

  const checkoutUrl = new URL(result.checkout_url);
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.bachs.io") {
    throw new Error("Bachs returned an unexpected checkout URL.");
  }

  return { checkout_id: result.checkout_id, checkout_url: checkoutUrl.toString() };
}
