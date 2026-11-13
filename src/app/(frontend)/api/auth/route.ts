import { NextResponse } from "next/server";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

type AuthAction = "sign-in" | "sign-up" | "google";

type AuthRequest = {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  next?: unknown;
};

export const runtime = "nodejs";
export const preferredRegion = "fra1";

const MAX_BODY_BYTES = 16_384;

class RequestBodyTooLargeError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Authentication request body is missing.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestBodyTooLargeError("Authentication request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}

function getSafeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  return value;
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please wait before trying again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

async function applyRateLimit(
  request: Request,
  action: AuthAction,
  email?: string,
) {
  const clientAddress = getClientAddress(request);
  if (!clientAddress) {
    throw new Error("The client address is unavailable for rate limiting.");
  }

  const isSignUp = action === "sign-up";
  const windowSeconds = isSignUp ? 60 * 60 : 15 * 60;
  const limit = isSignUp ? 10 : action === "google" ? 20 : 30;
  const rules = [
    { key: `auth:${action}:ip:${clientAddress}`, limit, windowSeconds },
  ];

  if (email) {
    rules.push({
      key: `auth:${action}:email:${email.toLowerCase()}`,
      limit: isSignUp ? 3 : 10,
      windowSeconds,
    });
  }

  const result = await checkRateLimit(rules);
  return result.allowed ? null : rateLimitedResponse(result.retryAfterSeconds);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(request.url).origin !== origin) {
    return NextResponse.json({ error: "Invalid authentication request." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Authentication request is too large." }, { status: 413 });
  }

  let body: AuthRequest;
  try {
    const parsed = await readJsonBody(request);
    if (!isRecord(parsed)) {
      return NextResponse.json({ error: "Invalid authentication request." }, { status: 400 });
    }
    body = parsed;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid authentication request." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "sign-in" && action !== "sign-up" && action !== "google") {
    return NextResponse.json({ error: "Unsupported authentication action." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (action !== "google" && (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (action !== "google" && (password.length < (action === "sign-up" ? 8 : 1) || password.length > 128)) {
    return NextResponse.json({ error: "Check your password and try again." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (action === "sign-up" && (!fullName || fullName.length > 120)) {
    return NextResponse.json({ error: "Enter your name to create an account." }, { status: 400 });
  }

  try {
    const limited = await applyRateLimit(request, action, email || undefined);
    if (limited) return limited;
  } catch (error) {
    console.error("[Auth] Rate-limit check failed:", error);
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    if (action === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 401 });
      return NextResponse.json({ ok: true });
    }

    const nextPath = getSafeNextPath(body.next);
    const callbackUrl = new URL("/callback", new URL(request.url).origin);
    callbackUrl.searchParams.set("next", nextPath);

    if (action === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: callbackUrl.toString(),
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ requiresEmailVerification: !data.session });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    if (!data.url) {
      return NextResponse.json({ error: "Google sign-in could not be started." }, { status: 502 });
    }
    return NextResponse.json({ redirectUrl: data.url });
  } catch (error) {
    console.error("[Auth] Supabase authentication request failed:", error);
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
