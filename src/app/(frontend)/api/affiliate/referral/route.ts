import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const REFERRAL_COOKIE = "godaapp_affiliate_ref";

function getSafeDestination(value: string | null, origin: string): URL {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return new URL("/catalog", origin);
  }

  const destination = new URL(value, origin);
  if (
    destination.origin !== origin ||
    (destination.pathname !== "/catalog" &&
      !destination.pathname.startsWith("/catalog/"))
  ) {
    return new URL("/catalog", origin);
  }

  destination.searchParams.delete("ref");
  return destination;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  const destination = getSafeDestination(
    requestUrl.searchParams.get("next"),
    requestUrl.origin,
  );

  if (!/^[A-Z0-9]{6,32}$/.test(code)) {
    return NextResponse.redirect(destination);
  }

  try {
    const address = getClientAddress(request);
    if (!address) {
      return NextResponse.json(
        { error: "Referral links are temporarily unavailable." },
        { status: 503 },
      );
    }

    const rateLimit = await checkRateLimit([
      {
        key: `affiliate-referral:ip:${address}`,
        limit: 60,
        windowSeconds: 15 * 60,
      },
    ]);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many referral link requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const payload = await getPayload({ config });
    const affiliates = await payload.find({
      collection: "affiliates",
      where: {
        and: [
          { referralCode: { equals: code } },
          { status: { equals: "approved" } },
          { referralLinkActive: { equals: true } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    const affiliate = affiliates.docs[0];
    if (!affiliate) return NextResponse.redirect(destination);

    const approvedApplication = await payload.find({
      collection: "affiliate-applications",
      where: {
        and: [
          { affiliate: { equals: affiliate.id } },
          { status: { equals: "approved" } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    if (!approvedApplication.docs.length) {
      return NextResponse.redirect(destination);
    }

    const response = NextResponse.redirect(destination);
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      secure: requestUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[Affiliate] Referral link validation failed:", error);
    return NextResponse.json(
      { error: "Referral links are temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
