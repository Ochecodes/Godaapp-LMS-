export type AffiliateApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

export function normalizeAffiliateEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAffiliateApplication(
  value: unknown,
): AffiliateApplicationInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email =
    typeof input.email === "string" ? normalizeAffiliateEmail(input.email) : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (
    fullName.length < 2 ||
    fullName.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length < 5 ||
    phone.length > 40 ||
    message.length < 10 ||
    message.length > 2000 ||
    input.termsAccepted !== true
  ) {
    return null;
  }

  return { fullName, email, phone, message };
}
