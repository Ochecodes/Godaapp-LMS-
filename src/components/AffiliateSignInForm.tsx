"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import { AuroraHero } from "@/components/ui/AuroraHero";

export function AffiliateSignInForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalEmailOpened, setApprovalEmailOpened] = useState(false);

  useEffect(() => {
    setApprovalEmailOpened(
      new URLSearchParams(window.location.search).get("approved") === "1",
    );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const response = await fetch("/api/affiliate/sign-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "The sign-in request could not be completed.";
        throw new Error(message);
      }

      if (
        typeof result === "object" &&
        result !== null &&
        "redirectUrl" in result &&
        result.redirectUrl === "/affiliate-dashboard"
      ) {
        window.location.assign("/affiliate-dashboard");
        return;
      }

      setNotice(
        typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
          ? result.message
          : "Check your email for next steps.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The sign-in request could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuroraHero className="min-h-screen justify-center px-4 py-10 sm:px-8 lg:px-12">
      <main className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/60 shadow-2xl shadow-black/30 backdrop-blur-md lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative min-h-64 overflow-hidden sm:min-h-80 lg:min-h-[42rem]">
          <Image
            alt="Affiliate learning with the GodaApp community"
            className="object-cover object-center"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 45vw"
            src="/afi.avif"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 max-w-sm text-white sm:bottom-8 sm:left-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F57C00]">
              GodaApp Affiliates
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Share skills. Grow with us.
            </h1>
          </div>
        </section>

        <section className="bg-white/95 p-6 text-zinc-950 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-xl">
            <Link
              className="inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-950"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to GodaApp
            </Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#068365]">
              Affiliate portal
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Enter the name and email used on your application. Approved members
              receive a secure, one-time sign-in link.
            </p>
            {approvalEmailOpened && (
              <p className="mt-4 rounded-lg border border-[#068365]/20 bg-[#068365]/5 px-3 py-2.5 text-sm leading-relaxed text-[#056d53]" role="status">
                Your application is approved. Confirm the name and email on your
                application to continue to the affiliate dashboard.
              </p>
            )}

            <form className="mt-7 space-y-4" onSubmit={submit}>
              <label className="block space-y-1.5 text-sm font-medium">
                Full name
                <input
                  autoComplete="name"
                  className={fieldClass}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  value={fullName}
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                Email address
                <input
                  autoComplete="email"
                  className={fieldClass}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="flex items-start gap-2 text-sm text-[#056d53]" role="status">
                  <MailCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {notice}
                </p>
              )}
              <button
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#068365] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]/50 disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                Send sign-in link
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              New to the program?{" "}
              <Link
                className="font-semibold text-[#068365] underline-offset-4 hover:underline"
                href="/affiliate"
              >
                Apply to become an affiliate
              </Link>
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
              If your application was declined or access was revoked, contact{" "}
              <a className="font-semibold text-[#068365] underline" href="mailto:godaappinfo@gmail.com">
                GodaApp support
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </AuroraHero>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#068365] focus-visible:ring-2 focus-visible:ring-[#068365]/20";
