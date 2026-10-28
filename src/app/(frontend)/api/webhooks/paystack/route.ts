import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { trackTinybirdEvent } from "@/lib/tinybird/client";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    email?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    metadata?: {
      course_id?: number | string;
      course_slug?: string;
      student_user_id?: string;
      ref_code?: string;
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[Paystack webhook] PAYSTACK_SECRET_KEY is not configured.");
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  const payloadText = await request.text();
  const expectedSignature = crypto.createHmac("sha512", secret).update(payloadText).digest("hex");
  const signature = request.headers.get("x-paystack-signature");
  if (
    !signature ||
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  ) {
    return NextResponse.json({ error: "Unauthorized payload signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(payloadText) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (event.event !== "charge.success" || !event.data) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { email, metadata, amount, currency } = event.data;
  if (
    !email ||
    typeof amount !== "number" ||
    currency !== "USD" ||
    !event.data.reference ||
    !metadata?.course_slug ||
    !metadata.course_id ||
    !metadata.student_user_id
  ) {
    return NextResponse.json({ error: "Payment metadata is incomplete." }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, metadata.course_slug);
  if (
    !course ||
    String(course.id) !== String(metadata.course_id) ||
    course.priceUSD <= 0 ||
    amount !== Math.round(course.priceUSD * 100)
  ) {
    return NextResponse.json({ error: "Payment does not match a published course price." }, { status: 400 });
  }

  const studentResult = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: metadata.student_user_id } },
    limit: 1,
    overrideAccess: true,
  });
  const student = studentResult.docs[0];
  if (!student || student.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Payment customer does not match the student account." }, { status: 400 });
  }

  const enrollmentResult = await payload.find({
    collection: "enrollments",
    where: { course: { equals: course.id } },
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  });
  const matchingEnrollment = enrollmentResult.docs.find(
    (enrollment) => enrollment.email.trim().toLowerCase() === email.trim().toLowerCase(),
  );
  if (!matchingEnrollment) {
    await payload.create({
      collection: "enrollments",
      data: { email, user: student.id, course: course.id, isActive: true },
      overrideAccess: true,
    });
  } else if (!matchingEnrollment.isActive) {
    await payload.update({
      collection: "enrollments",
      id: matchingEnrollment.id,
      data: { user: student.id, isActive: true },
      overrideAccess: true,
    });
  }

  if (metadata.ref_code) {
    const affiliateResult = await payload.find({
      collection: "affiliates",
      where: {
        and: [
          { referralCode: { equals: metadata.ref_code.toUpperCase().trim() } },
          { status: { equals: "approved" } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    const affiliate = affiliateResult.docs[0];
    if (affiliate) {
      const existingReferral = await payload.find({
        collection: "referrals",
        where: {
          and: [
            { affiliate: { equals: affiliate.id } },
            { course: { equals: course.id } },
            { referredEmail: { equals: email } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      });
      if (!existingReferral.docs.length) {
        await payload.create({
          collection: "referrals",
          data: {
            affiliate: affiliate.id,
            course: course.id,
            referredEmail: email,
            commissionAmount: (amount / 100) * 0.25,
            payoutStatus: "unpaid",
          },
          overrideAccess: true,
        });
      }
    }
  }

  try {
    await trackTinybirdEvent({
      event: "payment_succeeded",
      event_id: event.data.reference,
      visitor_id: "",
      course_slug: course.slug,
      amount_usd: amount / 100,
    });
  } catch (error) {
    console.error("[Tinybird] Payment-success ingestion failed:", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
