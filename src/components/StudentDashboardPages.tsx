"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://web.facebook.com/Godaapp", icon: "simple-icons:facebook" },
  { name: "Instagram", href: "https://www.instagram.com/godaappofficial", icon: "simple-icons:instagram" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/godaapp/", icon: "simple-icons:linkedin" },
  { name: "X", href: "https://x.com/godaapp", icon: "simple-icons:x" },
  { name: "YouTube", href: "https://www.youtube.com/@Godaapp", icon: "simple-icons:youtube" },
];

type StudentResource = {
  title: string;
  category: string;
  description: string;
  url: string;
  format: string;
};

const STARTER_RESOURCES: StudentResource[] = [
  {
    title: "Bitcoin: A Peer-to-Peer Electronic Cash System",
    category: "Bitcoin whitepaper",
    description: "The original paper describing Bitcoin’s peer-to-peer electronic cash system.",
    url: "https://bitcoin.org/bitcoin.pdf",
    format: "PDF · 9 pages",
  },
  {
    title: "The Fed Explained",
    category: "Financial markets",
    description: "A Federal Reserve guide to the structure and responsibilities of the US central bank.",
    url: "https://www.federalreserve.gov/aboutthefed/files/the-fed-explained.pdf",
    format: "PDF · Federal Reserve",
  },
];

const fieldClass = "min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#068365] focus-visible:ring-2 focus-visible:ring-[#068365]/20";

export function StudentResourcesPage({ resources }: { resources: StudentResource[] }) {
  const displayResources = resources.length ? resources : STARTER_RESOURCES;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="A curated library of learning materials from trusted public sources."
        icon="lucide:files"
        title="Resources"
      />
      <section aria-label="Learning resources" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayResources.map((resource) => (
          <article className="flex min-h-64 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6" key={resource.title}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-[#068365]/10 text-[#068365]">
                <DashboardIcon aria-hidden="true" className="size-6" icon="lucide:file-text" />
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{resource.category}</span>
            </div>
            <h2 className="mt-5 text-lg font-semibold leading-snug">{resource.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">{resource.format}</span>
              <a
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#068365] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={resource.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:download" />
                Download
              </a>
            </div>
          </article>
        ))}
      </section>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        {resources.length
          ? "Resources are hosted by their respective publishers. GodaApp does not control third-party content."
          : "Starter resources are shown until instructors publish the learning library."}
      </p>
    </main>
  );
}

export function StudentCommunityPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="Connect with learners and follow GodaApp across our official social channels."
        icon="lucide:users-round"
        title="Community"
      />
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <span className="grid size-11 place-items-center rounded-xl bg-[#068365]/10 text-[#068365]">
            <DashboardIcon aria-hidden="true" className="size-5" icon="lucide:messages-square" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Learn alongside a growing community</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Join the conversation, find new perspectives, and stay up to date with learning opportunities from GodaApp.
          </p>
          <div className="relative mt-5 aspect-[1.8] overflow-hidden rounded-xl bg-muted">
            <img alt="GodaApp learners connecting across a global community" className="h-full w-full object-cover" loading="lazy" src="/ContactIMG.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent" />
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
              <div aria-hidden="true" className="flex shrink-0 pl-1">
                {["/American.jpg", "/Nigerian.jpg", "/Asian.jpg"].map((src, index) => (
                  <img alt="" className={`size-8 rounded-full border-2 border-white object-cover ${index ? "-ml-2.5" : ""}`} key={src} loading="lazy" src={src} />
                ))}
                <span className="-ml-2.5 grid size-8 place-items-center rounded-full border-2 border-white bg-[#068365] text-[9px] font-semibold text-white">50+</span>
              </div>
              <p className="text-sm font-semibold text-white">A global network of learners</p>
            </div>
          </div>
          <ul className="mt-5 divide-y divide-border">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  className="flex min-h-14 items-center justify-between gap-4 py-2 text-sm font-medium transition hover:text-[#068365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={social.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="flex items-center gap-3">
                    <DashboardIcon aria-hidden="true" className="size-5" icon={social.icon} />
                    GodaApp on {social.name}
                  </span>
                  <DashboardIcon aria-hidden="true" className="size-4 text-muted-foreground" icon="lucide:external-link" />
                </a>
              </li>
            ))}
          </ul>
        </section>
        <DashboardContactForm
          heading="Say hello to the community team"
          subject="New GodaApp community message"
          description="Have an idea, want to collaborate, or need help finding your place in the community? Send us a message."
        />
      </div>
    </main>
  );
}

export function StudentSupportPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="Help with your account, courses, classes, and learning resources."
        icon="lucide:headset"
        title="Support"
      />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Talk to our support team</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choose the channel that works best for you. We’ll be glad to help.</p>
          </div>
          <a className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-[#068365]/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="https://wa.me/2348145356898?text=Hello%20GodaApp%20Support" rel="noopener noreferrer" target="_blank">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <DashboardIcon aria-hidden="true" className="size-5" icon="simple-icons:whatsapp" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Chat on WhatsApp</span>
              <span className="mt-1 block text-xs text-muted-foreground">+234 814 535 6898</span>
            </span>
            <DashboardIcon aria-hidden="true" className="size-4 text-muted-foreground" icon="lucide:external-link" />
          </a>
          <a className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-[#068365]/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="tel:+2348145356898">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#068365]/10 text-[#068365]">
              <DashboardIcon aria-hidden="true" className="size-5" icon="lucide:phone" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Call support</span>
              <span className="mt-1 block text-xs text-muted-foreground">+234 814 535 6898</span>
            </span>
            <DashboardIcon aria-hidden="true" className="size-4 text-muted-foreground" icon="lucide:arrow-up-right" />
          </a>
        </section>
        <DashboardContactForm
          heading="Send a support request"
          subject="New GodaApp student support request"
          description="Tell us what happened and our team will get back to you."
        />
      </div>
    </main>
  );
}

function DashboardContactForm({
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
