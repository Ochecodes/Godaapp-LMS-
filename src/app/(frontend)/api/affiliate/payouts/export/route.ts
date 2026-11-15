import { NextResponse } from "next/server";
import { getAffiliatePayoutsCsv } from "@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Export is temporarily unavailable." }, { status: 503 });
  }

  try {
    const limit = await checkRateLimit([
      {
        key: `affiliate-payout-export:ip:${address}`,
        limit: 20,
        windowSeconds: 60 * 60,
      },
    ]);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many export requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const csv = await getAffiliatePayoutsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="godaapp-affiliate-payouts.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Affiliate] Payout export failed:", error);
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "Authentication required."
        ? 401
        : message.includes("membership")
          ? 403
          : 503;
    return NextResponse.json(
      { error: status === 401 ? "Sign in to download this export." : "The export could not be created." },
      { status },
    );
  }
}
