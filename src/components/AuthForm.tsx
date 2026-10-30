"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuroraHero } from "@/components/ui/AuroraHero";

type AuthFormProps = { mode: "sign-in" | "sign-up" };

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [destination, setDestination] = useState("/dashboard");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    <AuroraHero className="min-h-screen justify-center px-4 py-10 sm:px-8 lg:px-12">
      <main className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/60 shadow-2xl shadow-black/30 backdrop-blur-md lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative min-h-64 overflow-hidden sm:min-h-80 lg:min-h-[42rem]">
          <img
            alt={isSignUp ? "Learners building their future together" : "Learner continuing a course"}
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={isSignUp ? "/SignupIMG.jpg" : "/SigninIMG.jpeg"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 max-w-sm text-white sm:bottom-8 sm:left-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F57C00]">GodaApp learning</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {isSignUp ? "Build knowledge that moves you forward." : "Welcome back to your learning journey."}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {destination === "/dashboard"
                ? "Continue learning with a community focused on practical digital asset skills."
                : "Sign in or create an account to continue with your selected course."}
            </p>
          </div>
        </section>

        <section className="bg-white/95 p-6 text-zinc-950 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-xl">
            <Link className="inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-950" href="/">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to GodaApp
            </Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#068365]">
              {isSignUp ? "Get started" : "Welcome back"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {isSignUp ? "Create your account" : "Sign in to GodaApp"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              {isSignUp ? "Your student dashboard is one step away." : "Sign in to continue to your student dashboard."}
            </p>

            <button
              className="mt-7 flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]/40 disabled:opacity-50"
              disabled={loading}
              onClick={() => void continueWithGoogle()}
              type="button"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
              <span className="h-px flex-1 bg-zinc-200" />or use email<span className="h-px flex-1 bg-zinc-200" />
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
              <div className="space-y-1.5 text-sm font-medium">
                <label htmlFor="auth-password">Password</label>
                <span className="relative block">
                  <input
                    id="auth-password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className={`${fieldClass} pr-12`}
                    minLength={isSignUp ? 8 : undefined}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#068365]/50"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    type="button"
                  >
                    {passwordVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </span>
              </div>
              {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p className="text-sm text-[#056d53]" role="status">{notice}</p>}
              <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#068365] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]/50 disabled:opacity-50" disabled={loading} type="submit">
                {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                {isSignUp ? "Create account" : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-zinc-600">
              {isSignUp ? "Already have an account?" : "New to GodaApp?"}{" "}
              <Link className="font-semibold text-[#068365] underline-offset-4 hover:underline" href={isSignUp ? toAuthLink("/sign-in") : toAuthLink("/sign-up")}>
                {isSignUp ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </AuroraHero>
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

const fieldClass = "min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#068365] focus-visible:ring-2 focus-visible:ring-[#068365]/20";

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
