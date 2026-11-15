import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isTinybirdConfigured, trackTinybirdEvent } from "@/lib/tinybird/client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getForwardedUserMetadata(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};

  const metadata: Record<string, unknown> = {};
  const stringFields: Record<string, number> = {
    full_name: 120,
    name: 120,
    avatar_url: 2048,
    picture: 2048,
    public_email: 254,
    about: 1000,
    location: 120,
    phone: 40,
    team: 120,
    company: 120,
    pronouns: 40,
    website: 2048,
  };

  for (const [key, maxLength] of Object.entries(stringFields)) {
    const field = value[key];
    if (typeof field === "string") metadata[key] = field.slice(0, maxLength);
  }

  if (isRecord(value.student_learning)) {
    const activityJson = JSON.stringify(value.student_learning);
    if (activityJson.length <= 8000) metadata.student_learning = value.student_learning;
  }

  return metadata;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { searchParams, pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const isPayloadPath =
    pathname.startsWith("/instructor-panel") || pathname.startsWith("/payload-api");
  if (isPayloadPath) return response;
  const isAffiliatePath = pathname.startsWith("/affiliate-dashboard");
  const isStudentPath = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const refCode = searchParams.get("ref");
  if (refCode) {
    const destination = new URL(request.url);
    destination.searchParams.delete("ref");
    const validationUrl = new URL("/api/affiliate/referral", request.url);
    validationUrl.searchParams.set("code", refCode);
    validationUrl.searchParams.set(
      "next",
      `${destination.pathname}${destination.search}`,
    );
    return NextResponse.redirect(validationUrl);
  }

  if (isAffiliatePath || isStudentPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Middleware] Missing Supabase environment variables for a protected route.");
      return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options }),
          );
          const existingCookies = response.cookies.getAll();
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          existingCookies.forEach(({ name, value, ...options }) => {
            response.cookies.set(name, value, options);
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data, error } = await supabase.auth.getClaims();
    if (error && error.name !== "AuthSessionMissingError") {
      console.error("[Middleware] Supabase session verification failed:", error);
      return NextResponse.json({ error: "Your session could not be verified. Please try again." }, { status: 503 });
    }

    const claims = data?.claims;
    if (!claims || typeof claims.sub !== "string") {
      const signInPath = isAffiliatePath ? "/affiliate/sign-in" : "/sign-in";
      return NextResponse.redirect(new URL(signInPath, request.url));
    }

    const metadata = claims.user_metadata;
    const verifiedUser = JSON.stringify({
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      user_metadata: getForwardedUserMetadata(metadata),
      email_verified:
        claims.email_verified === true || typeof claims.email_confirmed_at === "string",
    });
    if (verifiedUser.length > 12_000) {
      return NextResponse.json({ error: "Verified session data is too large." }, { status: 431 });
    }

    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("x-goda-verified-user", verifiedUser);
    const refreshedCookies = response.cookies.getAll();
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
    refreshedCookies.forEach(({ name, value, ...options }) => {
      response.cookies.set(name, value, options);
    });
    response.headers.set("Cache-Control", "private, no-store");
  }

  scheduleAnalyticsPageView(request, response, event);
  return response;
}

function scheduleAnalyticsPageView(
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent,
) {
  if (process.env.NODE_ENV !== "production") return;
  if (!isTinybirdConfigured()) return;

  const { pathname } = request.nextUrl;
  const isInternalPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/instructor-panel") ||
    pathname.startsWith("/payload-api");
  const isPrefetch =
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch";

  if (request.method !== "GET" || isInternalPath || isPrefetch) return;

  const existingVisitorId = request.cookies.get("goda_visitor_id")?.value;
  const visitorId = existingVisitorId ?? globalThis.crypto.randomUUID();
  if (!existingVisitorId) {
    request.cookies.set("goda_visitor_id", visitorId);
    response.cookies.set("goda_visitor_id", visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  event.waitUntil(
    trackTinybirdEvent({
      event: "page_view",
      visitor_id: visitorId,
      path: pathname.slice(0, 500),
      referrer: (request.headers.get("referer") ?? "").slice(0, 1000),
      user_agent: (request.headers.get("user-agent") ?? "").slice(0, 500),
    }).catch((error: unknown) => {
      console.error("[Tinybird] Page-view ingestion failed:", error);
    }),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|assets|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
