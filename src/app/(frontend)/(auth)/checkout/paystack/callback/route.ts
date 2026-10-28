import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { ensureCourseEnrollment, findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { cookies } from "next/headers";
import { trackTinybirdEvent } from "@/lib/tinybird/client";

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    customer?: { email?: string };
    metadata?: {
      course_id?: number | string;
      course_slug?: string;
      student_user_id?: string;
    };
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
  const slug = url.searchParams.get("course");
  const signInUrl = new URL(
    slug ? `/sign-in?course=${encodeURIComponent(slug)}` : "/sign-in",
    url.origin,
  );
  const failUrl = new URL("/dashboard/courses?payment=not-completed", url.origin);

  if (!reference || !slug || reference.length > 200) {
    return NextResponse.redirect(failUrl);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    const returnUrl = new URL("/checkout/paystack/callback", url.origin);
    returnUrl.searchParams.set("course", slug);
    returnUrl.searchParams.set("reference", reference);
    signInUrl.searchParams.set("next", returnUrl.pathname + returnUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[Paystack] PAYSTACK_SECRET_KEY is not configured for transaction verification.");
    return NextResponse.redirect(new URL("/dashboard/courses?payment=verification-unavailable", url.origin));
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
  );
  const result = (await response.json()) as PaystackVerifyResponse;
  if (!response.ok || !result.status || result.data?.status !== "success") {
    return NextResponse.redirect(failUrl);
  }

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, slug);
  if (!course) return NextResponse.redirect(failUrl);

  const expectedAmount = Math.round(course.priceUSD * 100);
  const paymentData = result.data;
  const metadata = paymentData.metadata;
  const validPayment =
    paymentData.currency === "USD" &&
    paymentData.amount === expectedAmount &&
    paymentData.customer?.email?.trim().toLowerCase() === user.email.trim().toLowerCase() &&
    String(metadata?.course_id) === String(course.id) &&
    metadata?.course_slug === course.slug &&
    metadata?.student_user_id === user.id;

  if (!validPayment) {
    console.error("[Paystack] Verified transaction did not match the signed-in user and course.", {
      reference,
      courseId: course.id,
      userId: user.id,
    });
    return NextResponse.redirect(failUrl);
  }

  await ensureCourseEnrollment(payload, user, course);
  try {
    const cookieStore = await cookies();
    await trackTinybirdEvent({
      event: "payment_succeeded",
      event_id: reference,
      visitor_id: cookieStore.get("goda_visitor_id")?.value,
      course_slug: course.slug,
      amount_usd: expectedAmount / 100,
    });
  } catch (error) {
    console.error("[Tinybird] Payment-success ingestion failed:", error);
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
