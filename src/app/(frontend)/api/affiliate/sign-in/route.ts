import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { normalizeAffiliateEmail } from "@/lib/affiliate-application";
import { findApprovedAffiliateApplication } from "@/lib/affiliate-membership";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin, hasSameOrigin } from "@/lib/request-origin";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

const GENERIC_MESSAGE =
  "If your application is approved, a sign-in link will arrive shortly. If you are new or your access was declined or revoked, apply or contact support.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid sign-in request." }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ error: "Sign-in details are too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 16_384);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: "Enter your name and email address." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Enter your name and email address." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const fullName = typeof record.fullName === "string" ? record.fullName.trim() : "";
  const email =
    typeof record.email === "string" ? normalizeAffiliateEmail(record.email) : "";

  if (
    fullName.length < 2 ||
    fullName.length > 120 ||
    email.length > 254 ||
    !EMAIL_PATTERN.test(email)
  ) {
    return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 });
  }

  const address = getClientAddress(request);
  const origin = getRequestOrigin(request);
  if (!address || !origin) {
    return NextResponse.json(
      { error: "The sign-in service is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const limit = await checkRateLimit([
      {
        key: `affiliate-sign-in:ip:${address}`,
        limit: 8,
        windowSeconds: 15 * 60,
      },
      {
        key: `affiliate-sign-in:email:${email}`,
        limit: 4,
        windowSeconds: 60 * 60,
      },
    ]);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait before trying again." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const payload = await getPayload({ config });
    const application = await findApprovedAffiliateApplication(payload, email);
    if (
      application &&
      normalizeName(application.fullName) === normalizeName(fullName)
    ) {
      const supabase = await createClient();
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getUser();
      if (sessionError) {
        console.error("[Affiliate] Existing sign-in session could not be verified:", sessionError);
        return NextResponse.json(
          { error: "The sign-in service is temporarily unavailable." },
          { status: 503 },
        );
      }

      if (
        sessionData.user?.email_confirmed_at &&
        typeof sessionData.user.email === "string" &&
        normalizeAffiliateEmail(sessionData.user.email) === email
      ) {
        return NextResponse.json({
          redirectUrl: "/affiliate-dashboard",
          message: "Your approved affiliate session is ready.",
        });
      }

      const callbackUrl = new URL("/affiliate/callback", origin).toString();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: callbackUrl,
          data: { full_name: application.fullName },
        },
      });

      if (error) {
        console.error("[Affiliate] Supabase sign-in link could not be sent:", error);
        return NextResponse.json(
          { error: "The sign-in link could not be sent. Please try again shortly." },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("[Affiliate] Sign-in request failed:", error);
    return NextResponse.json(
      { error: "The sign-in service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
