"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function TermsAcceptance() {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  return (
    <section className="mt-16 border-t border-zinc-200 pt-8" aria-labelledby="terms-acceptance-heading">
      <h3 id="terms-acceptance-heading" className="text-lg font-bold text-zinc-950">
        Acknowledgement
      </h3>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-3xl cursor-pointer items-start gap-3 text-sm leading-relaxed text-zinc-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[#068365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365] focus-visible:ring-offset-2"
          />
          <span>I have read and agree to the Terms of Use and Mentorship Terms.</span>
        </label>
        <Button
          type="button"
          disabled={!accepted}
          onClick={() => router.push("/dashboard")}
          className="min-w-24 bg-[#068365] text-white hover:bg-[#056d53] sm:self-center"
        >
          Close
        </Button>
      </div>
    </section>
  );
}
