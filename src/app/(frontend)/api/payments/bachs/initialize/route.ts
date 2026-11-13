import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getPayload } from "payload";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import config from "@/payload.config";
import { ensurePayloadStudent, findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { trackTinybirdEvent } from "@/lib/tinybird/client";
import {
  BachsApiError,
  BachsConfigurationError,
  createBachsCheckoutSession,
  getPublicAppBaseUrl,
} from "@/lib/bachs/client";

export async function POST(request: Request) {
  const clientAddress = getClientAddress(request);
  if (!clientAddress) {
    return NextResponse.json({ error: "Unable to verify this request." }, { status: 400 });
  }
  try {
    const rateLimit = await checkRateLimit([
      { key: `payments:initialize:ip:${clientAddress}`, limit: 20, windowSeconds: 15 * 60 },
    ]);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("[Bachs] Checkout rate-limit check failed:", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Sign in with a verified email before paying." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("course" in body) ||
    typeof body.course !== "string" ||
    !/^[a-z0-9][a-z0-9-]*$/.test(body.course)
  ) {
    return NextResponse.json({ error: "Choose a valid course." }, { status: 400 });
  }
  if (!process.env.BACHS_API_KEY) {
    return NextResponse.json(
      { error: "Bachs checkout is not configured yet. Please contact support." },
      { status: 503 },
    );
  }

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, body.course);
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  if (!Number.isFinite(course.priceUSD) || course.priceUSD <= 0) {
    return NextResponse.json({ error: "This course is free. Continue to your dashboard instead." }, { status: 409 });
  }
  await ensurePayloadStudent(payload, user);

  const cookieStore = await cookies();
  const referralCode = cookieStore.get("godaapp_affiliate_ref")?.value;
  let appBaseUrl: URL;
  try {
    appBaseUrl = getPublicAppBaseUrl();
  } catch (error) {
    console.error("[Bachs] Public return URL configuration error:", error);
    return NextResponse.json(
      { error: "Set APP_BASE_URL to a publicly reachable HTTPS app URL. Bachs cannot use localhost for checkout return URLs." },
      { status: 503 },
    );
  }
  const successUrl = new URL("/dashboard/courses?payment=processing", appBaseUrl).toString();
  const cancelUrl = new URL(
    `/enroll/continue?course=${encodeURIComponent(course.slug)}&payment=cancelled`,
    appBaseUrl,
  ).toString();
  const reference = `goda_${randomUUID()}`;
  const price = course.priceUSD.toFixed(2);

  let checkout;
  try {
    checkout = await createBachsCheckoutSession({
      amount: price,
      cancelUrl,
      customerEmail: user.email,
      customerName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
      metadata: {
        course_id: String(course.id),
        course_price_usd: price,
        course_slug: course.slug,
        student_user_id: user.id,
        ...(referralCode ? { ref_code: referralCode } : {}),
      },
      reference,
      successUrl,
    });
  } catch (error) {
    if (error instanceof BachsConfigurationError) {
      console.error("[Bachs] Checkout configuration error:", error.message);
      return NextResponse.json(
        { error: "Bachs checkout is not configured correctly. Please contact support." },
        { status: 503 },
      );
    }
    if (error instanceof BachsApiError) {
      console.error("[Bachs] Checkout session rejected:", {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[Bachs] Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Bachs could not start checkout. Please try again." },
      { status: 502 },
    );
  }

  try {
    await trackTinybirdEvent({
      event: "checkout_started",
      event_id: checkout.checkout_id,
      visitor_id: cookieStore.get("goda_visitor_id")?.value,
      course_slug: course.slug,
      amount_usd: course.priceUSD,
    });
  } catch (error) {
    console.error("[Tinybird] Checkout-start ingestion failed:", error);
  }

  return NextResponse.json({ checkoutUrl: checkout.checkout_url });
}
