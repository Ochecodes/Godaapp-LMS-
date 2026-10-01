import type { ReactNode } from "react";

import { MinimalFooter } from "@/components/ui/minimal-footer";
import { Nav } from "@/components/ui/Nav";
import { AuroraHero } from "@/components/ui/AuroraHero";
import { TermsAcceptance } from "@/components/ui/TermsAcceptance";

function TermsText({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-normal leading-relaxed text-zinc-700">{children}</h2>;
}

function TermsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TermsList({ items, ordered = true }: { items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";

  return (
    <List className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 text-base leading-relaxed text-zinc-700 marker:font-semibold marker:text-[#068365]`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </List>
  );
}

export default function TermsOfServicePage() {
  return (
    <>
      <div className="relative isolate overflow-hidden bg-white text-zinc-950">
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

        <Nav />
        <AuroraHero>
          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-center text-6xl font-medium tracking-tight text-zinc-100 drop-shadow-sm md:text-7xl xl:text-[5.25rem]">
            Terms of <span className="text-[#068365]">Service</span>
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-center text-lg text-zinc-400">
            Review the terms that apply when you use the GodaApp platform and
            its educational content.
          </p>
        </AuroraHero>

        <main className="mx-auto max-w-5xl px-6 pb-24 pt-12 sm:pt-16">
          <header className="mb-12 max-w-4xl space-y-4 sm:mb-16">
            <TermsText>
              By accessing or purchasing from Global Digital Assets Academy, you agree to the following terms:
            </TermsText>
          </header>

          <div className="space-y-12 sm:space-y-14">
            <TermsSection title="Terms of Use">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Educational Purpose Only</h3>
                <TermsText>All content is provided strictly for educational and informational purposes.</TermsText>
                <TermsText>Therefore, we do not guarantee:</TermsText>
                <TermsList items={["Profitability", "Investment returns", "Specific financial outcomes"]} />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Intellectual Property</h3>
                <TermsText>All course materials, videos, frameworks, text, graphics, branding, and proprietary educational content remain the intellectual property of Global Digital Assets Academy.</TermsText>
                <TermsText>Users may not:</TermsText>
                <TermsList items={["Reproduce", "Redistribute", "Resell", "Republish", "Record or share course materials"]} />
                <TermsText>Without written authorization.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Account Use</h3>
                <TermsText>Each account is licensed for individual use only.</TermsText>
                <TermsText>Account sharing, resale, or unauthorized transfer is prohibited and may result in termination without refund.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Platform Access</h3>
                <TermsText>We reserve the right to modify, improve, or update platform features, course content, pricing, and offerings at any time.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Termination Rights</h3>
                <TermsText>We reserve the right to suspend or terminate access for:</TermsText>
                <TermsList ordered={false} items={["Terms violations", "Fraudulent activity", "Abuse of staff/community", "Intellectual property infringement"]} />
              </div>
            </TermsSection>

            <TermsSection title="Mentorship Terms">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Mentorship Program Terms</h3>
                <TermsText>Where mentorship services are offered, the following terms apply:</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Educational Scope</h3>
                <TermsText>Mentorship is provided strictly for educational development and strategic discussion purposes.</TermsText>
                <TermsText>Mentorship does not constitute:</TermsText>
                <TermsList items={["Personalized financial advice", "Investment recommendations", "Managed trading/investing services"]} />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Student Responsibility</h3>
                <TermsText>Students remain solely responsible for all market decisions and financial outcomes.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Scheduling</h3>
                <TermsText>Mentorship sessions must be attended at scheduled times.</TermsText>
                <TermsText>Missed sessions without required notice may be forfeited.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Conduct Expectations</h3>
                <TermsText>Students are expected to maintain professional and respectful conduct during all mentorship interactions.</TermsText>
                <TermsText>Abusive, inappropriate, or disruptive conduct may result in removal without refund.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Confidentiality</h3>
                <TermsText>Mentorship content, proprietary frameworks, and strategic discussions remain confidential and may not be recorded, redistributed, or shared without permission.</TermsText>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">No Performance Guarantees</h3>
                <TermsText>Participation in mentorship does not guarantee:</TermsText>
                <TermsList items={["Profitability", "Faster learning outcomes", "Professional trading competence", "Investment success"]} />
              </div>
            </TermsSection>
          </div>
          <TermsAcceptance />
        </main>
      </div>
      <MinimalFooter />
    </>
  );
}
