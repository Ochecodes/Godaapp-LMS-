import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPayload } from "payload";
import { createClient } from "@/lib/supabase/server";
import config from "@/payload.config";
import { ensurePayloadStudent, findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { trackTinybirdEvent } from "@/lib/tinybird/client";

type PaystackInitializeResponse = {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string };
};

export async function POST(request: Request) {
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

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Paystack checkout is not configured yet. Please contact support." },
      { status: 503 },
    );
  }

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, body.course);
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  if (course.priceUSD <= 0) {
    return NextResponse.json({ error: "This course is free. Continue to your dashboard instead." }, { status: 409 });
  }
  await ensurePayloadStudent(payload, user);

  const cookieStore = await cookies();
  const referralCode = cookieStore.get("godaapp_affiliate_ref")?.value;
  const origin = new URL(request.url).origin;
  const callbackUrl = new URL("/checkout/paystack/callback", origin);
  callbackUrl.searchParams.set("course", course.slug);
  const amount = Math.round(course.priceUSD * 100);

  const providerResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      currency: "USD",
      callback_url: callbackUrl.toString(),
      metadata: {
        course_id: course.id,
        course_slug: course.slug,
        student_user_id: user.id,
        ...(referralCode ? { ref_code: referralCode } : {}),
      },
    }),
    cache: "no-store",
  });

  const result = (await providerResponse.json()) as PaystackInitializeResponse;
  if (
    !providerResponse.ok ||
    !result.status ||
    !result.data?.authorization_url ||
    !result.data.reference
  ) {
    console.error("[Paystack] Transaction initialization failed:", result.message ?? providerResponse.statusText);
    return NextResponse.json(
      { error: result.message ?? "Paystack could not start checkout. Please try again." },
      { status: 502 },
    );
  }

  try {
    await trackTinybirdEvent({
      event: "checkout_started",
      event_id: result.data.reference,
      visitor_id: cookieStore.get("goda_visitor_id")?.value,
      course_slug: course.slug,
      amount_usd: course.priceUSD,
    });
  } catch (error) {
    console.error("[Tinybird] Checkout-start ingestion failed:", error);
  }

  return NextResponse.json({ authorizationUrl: result.data.authorization_url });
}
