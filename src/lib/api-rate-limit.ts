import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function enforceApiRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  context: string,
): Promise<NextResponse | null> {
  try {
    const result = await checkRateLimit([{ key, limit, windowSeconds }]);
    if (result.allowed) return null;
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      },
    );
  } catch (error) {
    console.error(`[${context}] Rate-limit check failed:`, error);
    return NextResponse.json(
      { error: "This service is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
