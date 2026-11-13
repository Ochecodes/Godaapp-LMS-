"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardIcon } from "@/components/DashboardIcon";

const fieldClass = "min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#068365] focus-visible:ring-2 focus-visible:ring-[#068365]/20";

export function DashboardContactForm({
  heading,
  subject,
  description,
}: {
  heading: string;
  subject: string;
  description: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const nextInput = formRef.current?.querySelector<HTMLInputElement>('input[name="_next"]');
    if (nextInput) nextInput.value = `${window.location.origin}${window.location.pathname}?sent=1`;
    setSent(new URLSearchParams(window.location.search).get("sent") === "1");
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    setSubmitted(true);
    if (!formRef.current?.checkValidity()) {
      event.preventDefault();
      setSubmitted(false);
    }
  }

  return (
    <form
      action="https://formsubmit.co/godaappinfo@gmail.com"
      className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7"
      method="POST"
      onSubmit={submit}
      ref={formRef}
    >
      <input name="_subject" type="hidden" value={subject} />
      <input name="_captcha" type="hidden" value="false" />
      <input name="_template" type="hidden" value="table" />
      <input name="_next" type="hidden" value="" />
      <div>
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {sent && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300" role="status">Thanks for reaching out. Your message has been sent to the GodaApp team.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Full name
          <input autoComplete="name" className={fieldClass} maxLength={120} name="fullName" placeholder="Your name" required />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Email address
          <input autoComplete="email" className={fieldClass} name="email" placeholder="you@example.com" required type="email" />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">
        Message
        <textarea className={`${fieldClass} min-h-32 resize-y`} maxLength={3000} name="message" placeholder="How can we help?" required rows={5} />
      </label>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#068365] px-5 text-sm font-semibold text-white transition hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70" disabled={submitted} type="submit">
        {submitted ? "Sending…" : "Send message"}
        <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:arrow-right" />
      </button>
    </form>
  );
}
