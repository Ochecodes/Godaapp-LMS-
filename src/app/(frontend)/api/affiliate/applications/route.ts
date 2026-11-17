import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import { parseAffiliateApplication } from "@/lib/affiliate-application";
import { hasSameOrigin } from "@/lib/request-origin";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid application request." }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Application details are too large." }, { status: 413 });
  }

  let input: ReturnType<typeof parseAffiliateApplication>;
  try {
    input = parseAffiliateApplication(await readJsonBody(request, MAX_BODY_BYTES));
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: "Enter valid application details." }, { status: 400 });
  }

  if (!input) {
    return NextResponse.json({ error: "Complete every required application field." }, { status: 400 });
  }

  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json({ error: "The application service is temporarily unavailable." }, { status: 503 });
  }

  try {
    const limit = await checkRateLimit([
      {
        key: `affiliate-application:ip:${address}`,
        limit: 5,
        windowSeconds: 60 * 60,
      },
      {
        key: `affiliate-application:email:${input.email}`,
        limit: 1,
        windowSeconds: 24 * 60 * 60,
      },
    ]);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many application attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const payload = await getPayload({ config });
    const existing = await payload.find({
      collection: "affiliate-applications",
      where: { email: { equals: input.email } },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs.length) {
      return NextResponse.json(
        { error: "An application for this email already exists. Contact support if you need help." },
        { status: 409 },
      );
    }

    await payload.create({
      collection: "affiliate-applications",
      data: {
        ...input,
        status: "pending",
        approvalNotificationStatus: "not_sent",
        termsAcceptedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    });

    return NextResponse.json(
      { message: "Your application was received and is awaiting review." },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Affiliate] Application submission failed:", error);
    return NextResponse.json(
      { error: "Your application could not be saved. Please try again shortly." },
      { status: 503 },
    );
  }
}
