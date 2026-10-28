"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";

import { AuroraHero } from "@/components/ui/AuroraHero";
import { Button } from "@/components/ui/button";

export default function AffiliateSignUp() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    window.setTimeout(() => {
      formRef.current?.submit();
    }, 850);
  }

  return (
    <AuroraHero className="min-h-screen justify-center px-4 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/60 shadow-2xl shadow-black/30 backdrop-blur-md lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-80 overflow-hidden lg:min-h-[38rem]">
          <img
            src="/students.jfif"
            alt="Students learning together"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 max-w-sm text-white sm:bottom-8 sm:left-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F57C00]">GodaApp Affiliates</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Build with a system that compounds.</h2>
          </div>
        </div>

        <div className="relative bg-white/95 p-6 text-zinc-950 sm:p-10 lg:p-14">
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#068365]">Affiliate program</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Become a partner</h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">Refer to earn, join our affiliate program.</p>

            <form
              ref={formRef}
              action="https://formsubmit.co/godaappinfo@gmail.com"
              method="POST"
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
            >
              <input type="hidden" name="_subject" value="New GodaApp affiliate application" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_next" value="http://localhost:3000/affiliate" />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>First name</span>
                  <input required name="firstName" autoComplete="given-name" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/20" />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Last name</span>
                  <input required name="lastName" autoComplete="family-name" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/20" />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm font-medium">
                <span>Email</span>
                <input required type="email" name="email" autoComplete="email" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/20" />
              </label>

              <label className="block space-y-1.5 text-sm font-medium">
                <span>Phone number</span>
                <input required type="tel" name="phone" autoComplete="tel" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/20" />
              </label>

              <label className="block space-y-1.5 text-sm font-medium">
                <span>Why do you want to join?</span>
                <textarea required name="message" rows={4} className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/20" />
              </label>

              <label className="flex items-start gap-3 text-xs leading-relaxed text-zinc-600">
                <input required type="checkbox" name="termsAccepted" value="accepted" className="mt-0.5 size-4 shrink-0 accent-[#068365]" />
                <span>
                  I agree to the <a href="/terms-of-service" className="font-semibold text-[#068365] underline underline-offset-2">Terms of Service</a> and <a href="/privacy-policy" className="font-semibold text-[#068365] underline underline-offset-2">Privacy Policy</a>.
                </span>
              </label>

              <Button type="submit" disabled={submitted} className="h-11 w-full rounded-lg bg-[#068365] font-semibold text-white transition-colors hover:bg-[#056d53] disabled:cursor-not-allowed disabled:opacity-100 disabled:text-white">
                {submitted ? <><Check className="size-5" aria-label="Submitted" /> Submitted</> : <>Submit application <ArrowRight className="size-4" aria-hidden="true" /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuroraHero>
  );
}
