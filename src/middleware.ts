import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { trackTinybirdEvent } from "@/lib/tinybird/client";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { searchParams, pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const isPayloadPath =
    pathname.startsWith("/instructor-panel") || pathname.startsWith("/payload-api");
  if (isPayloadPath) return response;

  const refCode = searchParams.get("ref");
  if (refCode) {
    response.cookies.set("godaapp_affiliate_ref", refCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Middleware] Missing Supabase env vars — skipping auth checks");
    scheduleAnalyticsPageView(request, response, event);
    return response;
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
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname.startsWith("/affiliate-dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const role = user.user_metadata?.role;
    if (role !== "affiliate" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  scheduleAnalyticsPageView(request, response, event);
  return response;
}

function scheduleAnalyticsPageView(
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent,
) {
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
