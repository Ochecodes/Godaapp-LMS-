import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { normalizeStudentEmail } from "@/lib/student-email";
import { trackTinybirdEvent } from "@/lib/tinybird/client";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/request-body";
import { getClientAddress } from "@/lib/rate-limit";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

const MAX_WEBHOOK_BODY_BYTES = 65_536;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function verifyBachsSignature(rawBody: string, headers: Headers, secret: string): boolean {
  const signatureV2 = headers.get("x-bachs-signature-v2");
  const signatures: string[] = [];
  let timestamp: string | null = null;

  if (signatureV2) {
    const fields = signatureV2.split(",").map((field) => field.trim());
    timestamp = fields.find((field) => field.startsWith("t="))?.slice(2) ?? null;
    signatures.push(...fields.filter((field) => field.startsWith("v1=")).map((field) => field.slice(3)));
  } else {
    timestamp = headers.get("x-bachs-timestamp");
    const signature = headers.get("x-bachs-signature");
    if (signature) signatures.push(signature);
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((signature) => {
    if (!/^[\da-f]{64}$/i.test(signature)) return false;
    const provided = Buffer.from(signature, "hex");
    return provided.length === expected.length && crypto.timingSafeEqual(expected, provided);
  });
}

export async function POST(request: Request) {
  const secret = process.env.BACHS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Bachs webhook] BACHS_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  let rawBody: string;
  try {
    rawBody = await readTextBody(request, MAX_WEBHOOK_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (!verifyBachsSignature(rawBody, request.headers, secret)) {
    return NextResponse.json({ error: "Unauthorized payload signature." }, { status: 401 });
  }

  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Payment service is temporarily unavailable." }, { status: 503 });
  }
  const rateLimited = await enforceApiRateLimit(
    `bachs-webhook:ip:${address}`,
    1200,
    60 * 60,
    "Bachs webhook",
  );
  if (rateLimited) return rateLimited;

  let parsedEvent: unknown;
  try {
    parsedEvent = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (!isRecord(parsedEvent)) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (parsedEvent.type !== "checkout.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }
  if (!isRecord(parsedEvent.data)) {
    return NextResponse.json({ error: "Payment data is missing." }, { status: 400 });
  }

  const data = parsedEvent.data;
  if (data.payment_status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 });
  }
  const metadata = isRecord(data.metadata) ? data.metadata : null;
  const customer = isRecord(data.customer) ? data.customer : null;
  const customerDetails = isRecord(data.customer_details) ? data.customer_details : null;
  const amount = typeof data.amount === "string" ? Number(data.amount) : Number.NaN;
  const coursePrice = typeof metadata?.course_price_usd === "string"
    ? Number(metadata.course_price_usd)
    : Number.NaN;
  const email = typeof customerDetails?.email === "string"
    ? customerDetails.email
    : typeof customer?.email === "string"
      ? customer.email
      : "";

  if (
    data.status !== "completed" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    typeof data.currency !== "string" ||
    typeof data.checkout_id !== "string" ||
    !data.checkout_id ||
    !email ||
    !metadata ||
    !Number.isFinite(coursePrice) ||
    coursePrice <= 0 ||
    (data.currency === "USD" && amount !== coursePrice) ||
    typeof metadata.course_slug !== "string" ||
    !metadata.course_slug ||
    !metadata.course_id ||
    typeof metadata.student_user_id !== "string" ||
    !metadata.student_user_id
  ) {
    return NextResponse.json({ error: "Payment metadata is incomplete or invalid." }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, metadata.course_slug);
  if (!course || String(course.id) !== String(metadata.course_id)) {
    return NextResponse.json({ error: "Payment does not match a published course." }, { status: 400 });
  }

  const studentResult = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: metadata.student_user_id } },
    limit: 1,
    overrideAccess: true,
  });
  const student = studentResult.docs[0];
  const normalizedEmail = normalizeStudentEmail(email);
  if (!student || normalizeStudentEmail(student.email) !== normalizedEmail) {
    return NextResponse.json({ error: "Payment customer does not match the student account." }, { status: 400 });
  }

  const enrollmentResult = await payload.find({
    collection: "enrollments",
    where: {
      and: [
        { course: { equals: course.id } },
        { email: { equals: normalizedEmail } },
      ],
    },
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  });
  const matchingEnrollment = enrollmentResult.docs.find((enrollment) => enrollment.isActive)
    ?? enrollmentResult.docs[0];
  if (!matchingEnrollment) {
    await payload.create({
      collection: "enrollments",
      data: {
        email: normalizedEmail,
        user: student.id,
        course: course.id,
        isActive: true,
        providerCheckoutId: data.checkout_id,
      },
      overrideAccess: true,
    });
  } else if (!matchingEnrollment.isActive) {
    await payload.update({
      collection: "enrollments",
      id: matchingEnrollment.id,
      data: {
        email: normalizedEmail,
        user: student.id,
        isActive: true,
        providerCheckoutId: data.checkout_id,
      },
      overrideAccess: true,
    });
  }

  if (typeof metadata.ref_code === "string" && metadata.ref_code) {
    const affiliateResult = await payload.find({
      collection: "affiliates",
      where: {
        and: [
          { referralCode: { equals: metadata.ref_code.toUpperCase().trim() } },
          { status: { equals: "approved" } },
          { referralLinkActive: { equals: true } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    const affiliate = affiliateResult.docs[0];
    if (affiliate) {
      const membershipResult = await payload.find({
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
      if (membershipResult.docs.length) {
        const existingReferral = await payload.find({
          collection: "referrals",
          where: { providerCheckoutId: { equals: data.checkout_id } },
          limit: 1,
          overrideAccess: true,
        });
        if (!existingReferral.docs.length) {
          await payload.create({
            collection: "referrals",
            data: {
              affiliate: affiliate.id,
              course: course.id,
              referredEmail: normalizedEmail,
              saleAmount: coursePrice,
              commissionRate: 0.25,
              commissionAmount: Math.round(coursePrice * 25) / 100,
              providerCheckoutId: data.checkout_id,
              isReversed: false,
              payoutStatus: "unpaid",
            },
            overrideAccess: true,
          });
        }
      }
    }
  }

  try {
    await trackTinybirdEvent({
      event: "payment_succeeded",
      event_id: data.checkout_id,
      visitor_id: "",
      course_slug: course.slug,
      amount_usd: coursePrice,
    });
  } catch (error) {
    console.error("[Tinybird] Payment-success ingestion failed:", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
