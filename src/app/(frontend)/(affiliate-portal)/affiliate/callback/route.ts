import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { ensureAffiliateMembership } from "@/lib/affiliate-membership";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

function getAffiliateDestination(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/affiliate-dashboard";
  }

  const destination = new URL(value, "https://godaapp.invalid");
  const isApprovalSignIn =
    destination.pathname === "/affiliate/sign-in" &&
    destination.searchParams.get("approved") === "1";
  if (
    destination.origin !== "https://godaapp.invalid" ||
    (destination.pathname !== "/affiliate-dashboard" &&
      !destination.pathname.startsWith("/affiliate-dashboard/") &&
      !isApprovalSignIn)
  ) {
    return "/affiliate-dashboard";
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = getRequestOrigin(request) ?? requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/affiliate/sign-in?error=verification", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/affiliate/sign-in?error=verification", origin));
  }

  const { data, error: userError } = await supabase.auth.getUser();
  const user = data.user;
  if (userError || !user?.email || !user.email_confirmed_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/affiliate/sign-in?error=verification", origin));
  }

  try {
    const payload = await getPayload({ config });
    const membership = await ensureAffiliateMembership(payload, user);
    if (!membership) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/affiliate/sign-in?error=access", origin));
    }
  } catch (caught) {
    console.error("[Affiliate] Verified membership setup failed:", caught);
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/affiliate/sign-in?error=setup", origin));
  }

  const destination = getAffiliateDestination(requestUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(destination, origin));
}
