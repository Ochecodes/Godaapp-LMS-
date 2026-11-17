import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientAddress } from "@/lib/rate-limit";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

function safeNextPath(value: string | null, origin: string) {
  if (
    !value ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  if (new URL(value, origin).origin !== origin) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), url.origin);

  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
  const rateLimited = await enforceApiRateLimit(
    `auth-callback:ip:${address}`,
    60,
    15 * 60,
    "Auth callback",
  );
  if (rateLimited) return rateLimited;

  if (!code || code.length > 4096) {
    return NextResponse.redirect(new URL("/sign-in?error=verification", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=verification", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}