"use client";

import type { CSSProperties, FormEvent } from "react";
import { useRef, useState } from "react";
import { ArrowRight, Check, Headphones, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTACT_LINKS = [
  { icon: Mail, label: "godaappinfo@gmail.com", href: "mailto:godaappinfo@gmail.com" },
  { icon: Phone, label: "+234 814 535 6898", href: "tel:+2348145356898" },
  { icon: Headphones, label: "Contact support", href: "#contact-form" },
];

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://web.facebook.com/Godaapp",
    icon: <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" /></svg>,
  },
  {
    name: "Github",
    href: "#",
    icon: <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/godaappofficial",
    icon: <svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" /></svg>,
  },
  {
    name: "Linkedin",
    href: "https://www.linkedin.com/company/godaapp/",
    icon: <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
  },
  {
    name: "Twitter",
    href: "https://x.com/godaapp",
    icon: <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  },
  {
    name: "Youtube",
    href: "https://www.youtube.com/@Godaapp",
    icon: <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
  },
];

const ribbons = [
  { left: "8%", top: "34%", color: "#F57C00", rotate: "-22deg", delay: "0ms" },
  { left: "15%", top: "18%", color: "#068365", rotate: "18deg", delay: "60ms" },
  { left: "27%", top: "12%", color: "#F57C00", rotate: "42deg", delay: "120ms" },
  { left: "38%", top: "22%", color: "#068365", rotate: "-35deg", delay: "180ms" },
  { left: "52%", top: "10%", color: "#F57C00", rotate: "16deg", delay: "240ms" },
  { left: "68%", top: "18%", color: "#068365", rotate: "-18deg", delay: "300ms" },
  { left: "82%", top: "30%", color: "#F57C00", rotate: "34deg", delay: "360ms" },
  { left: "92%", top: "45%", color: "#068365", rotate: "-28deg", delay: "420ms" },
  { left: "10%", top: "63%", color: "#068365", rotate: "28deg", delay: "480ms" },
  { left: "23%", top: "78%", color: "#F57C00", rotate: "-42deg", delay: "540ms" },
  { left: "44%", top: "84%", color: "#068365", rotate: "20deg", delay: "600ms" },
  { left: "63%", top: "78%", color: "#F57C00", rotate: "-15deg", delay: "660ms" },
  { left: "79%", top: "70%", color: "#068365", rotate: "38deg", delay: "720ms" },
  { left: "90%", top: "62%", color: "#F57C00", rotate: "-32deg", delay: "780ms" },
];

function FormDots() {
  return (
    <div
      aria-hidden="true"
      className="h-4 w-full opacity-60 text-zinc-400"
      style={{
        backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
        backgroundSize: "6px 100%",
        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    />
  );
}

export function ContactWithGlobe({ className = "" }: { className?: string }) {
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
    <section className={cn("relative isolate w-full overflow-hidden bg-white py-12 text-zinc-950 sm:py-16", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <img src="/Zincbg.svg" alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">Get in touch</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-700">
                Reach out via any channel below. We typically reply within one business day.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {CONTACT_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex w-fit items-center gap-3 text-sm text-zinc-700 transition-colors hover:text-[#068365]"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-600 transition-colors group-hover:border-[#068365]/40 group-hover:text-[#068365]">
                    <Icon className="size-3.5" />
                  </span>
                  {label}
                </a>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-700">Follow us</h4>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(({ name, href, icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="flex size-9 items-center justify-center rounded-lg border border-zinc-300 bg-white/80 text-zinc-700 transition-colors hover:border-[#068365]/40 hover:text-[#068365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <form
            ref={formRef}
            id="contact-form"
            action="https://formsubmit.co/godaappinfo@gmail.com"
            method="POST"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <input type="hidden" name="_subject" value="New GodaApp contact message" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_next" value="http://localhost:3000/contact" />

            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Send a message</h3>
              <p className="mt-1 text-sm text-zinc-700">Fill out the form and we&apos;ll get back to you promptly.</p>
            </div>
            <FormDots />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-700">
                Full Name
                <input required name="fullName" autoComplete="name" placeholder="Your name" className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/10" />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-700">
                Company
                <input name="company" autoComplete="organization" placeholder="Your company" className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/10" />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-700">
              Email Address
              <input required type="email" name="email" autoComplete="email" placeholder="you@example.com" className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/10" />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-700">
              Message
              <textarea required name="message" rows={4} placeholder="Type your message here" className="resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-normal normal-case tracking-normal text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-[#068365] focus:ring-2 focus:ring-[#068365]/10" />
            </label>

            <div className="relative z-10 w-fit">
              {submitted && (
                <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
                  {ribbons.map((ribbon, index) => (
                    <span
                      key={index}
                      className="contact-ribbon-burst absolute h-2 w-12 rounded-full"
                      style={{
                        left: ribbon.left,
                        top: ribbon.top,
                        backgroundColor: ribbon.color,
                        ["--rotate" as string]: ribbon.rotate,
                        ["--travel-x" as string]: `${index % 2 ? 70 : -70}px`,
                        ["--travel-y" as string]: `${index % 3 === 0 ? -120 : 120}px`,
                        animationDelay: ribbon.delay,
                      } as CSSProperties}
                    />
                  ))}
                </div>
              )}
              <style>{`
                @keyframes contact-ribbon-burst {
                  0% { opacity: 0; transform: translate(0, 0) rotate(var(--rotate)) scale(0.4); }
                  20% { opacity: 1; }
                  100% { opacity: 0; transform: translate(var(--travel-x), var(--travel-y)) rotate(calc(var(--rotate) + 220deg)) scale(1); }
                }
                .contact-ribbon-burst {
                  animation: contact-ribbon-burst 950ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                  .contact-ribbon-burst { animation: none; opacity: 0; }
                }
              `}</style>
              <Button
                type="submit"
                disabled={submitted}
                aria-label={submitted ? "Message submitted" : undefined}
                className={cn(
                  "h-11 w-fit rounded-xl px-8 text-sm font-semibold transition-colors hover:bg-[#056d53] disabled:cursor-not-allowed disabled:opacity-100",
                  submitted ? "bg-white text-[#068365] ring-1 ring-[#068365]/30 hover:bg-white" : "bg-[#068365] text-white",
                )}
              >
                {submitted ? <Check className="size-5" aria-hidden="true" /> : <>Submit <ArrowRight className="size-4" /></>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactWithGlobe;
