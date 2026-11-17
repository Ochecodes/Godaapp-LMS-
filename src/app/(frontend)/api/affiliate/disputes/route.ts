import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { ensureAffiliateMembership } from "@/lib/affiliate-membership";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import { hasSameOrigin } from "@/lib/request-origin";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export const runtime = "nodejs";

type DisputeCategory = "referral" | "payout" | "account" | "other";

function isDisputeCategory(value: unknown): value is DisputeCategory {
  return value === "referral" || value === "payout" || value === "account" || value === "other";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid dispute request." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 12_288);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: "Enter the dispute details and try again." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Enter the dispute details and try again." }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const category = body.category;
  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (subject.length < 3 || subject.length > 160) {
    return NextResponse.json({ error: "Subject must be between 3 and 160 characters." }, { status: 400 });
  }
  if (!isDisputeCategory(category)) {
    return NextResponse.json({ error: "Choose a dispute category." }, { status: 400 });
  }
  if (details.length < 20 || details.length > 4000) {
    return NextResponse.json({ error: "Details must be between 20 and 4,000 characters." }, { status: 400 });
  }

  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Dispute submission is temporarily unavailable." }, { status: 503 });
  }

  try {
    const limit = await checkRateLimit([
      {
        key: `affiliate-dispute:ip:${address}`,
        limit: 3,
        windowSeconds: 60 * 60,
      },
    ]);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many disputes were submitted. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[Affiliate] Dispute session verification failed:", authError);
      return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    }
    const user = authData.user;
    if (!user?.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "Sign in to submit a dispute." }, { status: 401 });
    }

    const payloadClient = await getPayload({ config });
    const membership = await ensureAffiliateMembership(payloadClient, user);
    if (!membership) {
      return NextResponse.json({ error: "Affiliate membership is not active." }, { status: 403 });
    }

    const dispute = await payloadClient.create({
      collection: "affiliate-disputes",
      data: {
        affiliate: membership.affiliate.id,
        subject,
        category,
        details,
        status: "submitted",
      },
      overrideAccess: true,
    });

    let notificationSent = false;
    try {
      const emailResponse = await fetch("https://formsubmit.co/ajax/godaappinfo@gmail.com", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _subject: "Affiliate dispute — GodaApp",
          name: membership.application.fullName,
          email: user.email,
          disputeReference: String(dispute.id),
          category,
          subject,
          details,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      notificationSent = emailResponse.ok;
      if (!emailResponse.ok) {
        console.error("[Affiliate] Dispute was saved but FormSubmit returned an unsuccessful response.");
      }
    } catch (error) {
      console.error("[Affiliate] Dispute was saved but its email notification failed:", error);
    }

    return NextResponse.json(
      {
        id: dispute.id,
        notificationSent,
        message: notificationSent
          ? "Your dispute was submitted and sent to GodaApp support."
          : "Your dispute was saved, but its email notification could not be sent. Please contact support and include the dispute reference.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Affiliate] Dispute submission failed:", error);
    return NextResponse.json(
      { error: "The dispute could not be submitted. Please try again later." },
      { status: 503 },
    );
  }
}
