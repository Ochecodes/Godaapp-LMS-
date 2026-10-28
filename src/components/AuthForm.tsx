"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "sign-in" | "sign-up" };

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [destination, setDestination] = useState("/dashboard");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    const course = params.get("course");
    if (next?.startsWith("/") && !next.startsWith("//")) {
      setDestination(next);
    } else {
      setDestination(
        course ? `/enroll/continue?course=${encodeURIComponent(course)}` : "/dashboard",
      );
    }
  }, []);

  function callbackUrl() {
    const url = new URL("/callback", window.location.origin);
    url.searchParams.set("next", destination);
    return url.toString();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: callbackUrl(),
          },
        });
        if (authError) throw authError;
        if (!data.session) {
          setNotice("Check your email to verify your account. We’ll continue after verification.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }
      window.location.assign(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in couldn't be started.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to GodaApp
        </Link>
        <div className={`mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${isSignUp ? "md:grid-cols-[0.85fr_1.15fr]" : "md:grid-cols-[0.7fr_1fr]"}`}>
          <section className="hidden flex-col justify-between bg-[#0b352b] p-9 text-white md:flex">
            <img alt="GodaApp" className="h-10 w-fit object-contain" src="/logo.svg" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Learn with purpose</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight">
                {isSignUp ? "Build knowledge that moves you forward." : "Welcome back to your learning journey."}
              </h1>
              <p className="mt-4 text-sm leading-6 text-white/75">
                {destination === "/dashboard"
                  ? "Sign in or create your account to continue to the student dashboard."
                  : "Sign in or create an account to continue with your selected course."}
              </p>
            </div>
            <p className="text-xs text-white/60">GodaApp · Learning platform</p>
          </section>

          <section className="p-6 sm:p-9">
            <img alt="GodaApp" className="h-9 w-fit object-contain md:hidden" src="/logo.svg" />
            <p className="mt-5 text-sm font-semibold text-primary">{isSignUp ? "Get started" : "Welcome back"}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {isSignUp ? "Create your account" : "Sign in to GodaApp"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp ? "Your student dashboard is one step away." : "Sign in to continue to your student dashboard."}
            </p>

            <button
              className="mt-6 flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={loading}
              onClick={() => void continueWithGoogle()}
              type="button"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {isSignUp && (
                <label className="block space-y-1.5 text-sm font-medium">
                  Full name
                  <input autoComplete="name" className={fieldClass} onChange={(e) => setFullName(e.target.value)} required value={fullName} />
                </label>
              )}
              <label className="block space-y-1.5 text-sm font-medium">
                Email address
                <input autoComplete="email" className={fieldClass} onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Password
                <input autoComplete={isSignUp ? "new-password" : "current-password"} className={fieldClass} minLength={isSignUp ? 8 : undefined} onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
              </label>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              {notice && <p className="text-sm text-primary" role="status">{notice}</p>}
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" disabled={loading} type="submit">
                {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                {isSignUp ? "Create account" : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "New to GodaApp?"}{" "}
              <Link className="font-semibold text-primary underline-offset-4 hover:underline" href={isSignUp ? toAuthLink("/sign-in") : toAuthLink("/sign-up")}>
                {isSignUp ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );

  function toAuthLink(path: string) {
    if (typeof window === "undefined") return path;
    const params = new URLSearchParams(window.location.search);
    const course = params.get("course");
    const next = params.get("next");
    if (next?.startsWith("/") && !next.startsWith("//")) return `${path}?next=${encodeURIComponent(next)}`;
    if (course) return `${path}?course=${encodeURIComponent(course)}`;
    return path;
  }
}

const fieldClass = "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.47-4.73 7.16l7.42 5.76c4.33-4 7.35-9.89 7.35-17.39Z" />
      <path fill="#FBBC05" d="M10.53 28.41a14.4 14.4 0 0 1 0-8.82l-7.98-6.2a23.97 23.97 0 0 0 0 21.22l7.98-6.2Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.42-5.76c-2.06 1.38-4.7 2.2-8.48 2.2-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}
