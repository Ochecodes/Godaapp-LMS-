import type { ReactNode } from "react";

import { MinimalFooter } from "@/components/ui/minimal-footer";
import { Nav } from "@/components/ui/Nav";
import { AuroraHero } from "@/components/ui/AuroraHero";

function PolicyText({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-normal leading-relaxed text-zinc-700">{children}</h2>;
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PolicyList({ items, ordered = true }: { items: string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";

  return (
    <List className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 text-base leading-relaxed text-zinc-700 marker:font-semibold marker:text-[#068365]`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </List>
  );
}

export default function PrivacyPolicyPage() {
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
            Privacy <span className="text-[#068365]">Policy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-balance text-center text-lg leading-relaxed text-zinc-400">
            Global Digital Assets Academy, we respect your privacy and are committed to protecting your personal information.
          </p>
        </AuroraHero>
        <main className="mx-auto max-w-5xl px-6 pb-24 pt-12 sm:pt-16">
          <header className="mb-12 max-w-4xl space-y-4 sm:mb-16">
            <PolicyText>
              This Privacy Policy explains how we collect, use, store, and protect information when you access our website, platform, products, and services.
            </PolicyText>
            <PolicyText>
              So, by using Global Digital Assets Academy, you acknowledge that your information may be collected and processed in accordance with our Privacy Policy.
            </PolicyText>
          </header>

          <div className="space-y-12 sm:space-y-14">
            <PolicySection title="1. Information We Collect">
              <PolicyText>We may collect the following categories of information:</PolicyText>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-zinc-950">Personal Information</h3>
                  <PolicyList items={["Full name", "Email address", "Phone number (where provided)", "Billing/payment information", "Account login credentials"]} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-zinc-950">Technical Information</h3>
                  <PolicyList items={["Device/browser type", "IP address", "Approximate location data", "Platform usage/activity logs", "Cookies and analytics data"]} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-zinc-950">Transaction Information</h3>
                  <PolicyList items={["Purchase history", "Subscription status", "Billing records"]} />
                </div>
              </div>
            </PolicySection>

            <PolicySection title="2. How We Use Your Information">
              <PolicyText>We use collected information to:</PolicyText>
              <PolicyList items={["Provide access to courses and services", "Process transactions and subscriptions", "Manage student accounts", "Improve platform functionality and user experience", "Communicate important updates and support responses", "Send educational/marketing communications where permitted", "Monitor security and prevent fraud/abuse", "Comply with legal and regulatory obligations"]} />
            </PolicySection>

            <PolicySection title="3. Payment Processing">
              <PolicyText>Payments may be processed through third-party payment providers.</PolicyText>
              <PolicyText>We do not directly store full payment card details unless explicitly stated otherwise by our payment infrastructure.</PolicyText>
              <PolicyText>Third-party processors are responsible for securely handling payment data in accordance with their own privacy and security standards.</PolicyText>
            </PolicySection>

            <PolicySection title="4. Cookies & Tracking Technologies">
              <PolicyText>We may use cookies and similar technologies to:</PolicyText>
              <PolicyList items={["Remember user preferences", "Improve website performance", "Analyze traffic and engagement", "Support security and fraud prevention", "Deliver relevant marketing where applicable"]} />
              <PolicyText>Users may manage cookie settings through their browser.</PolicyText>
            </PolicySection>

            <PolicySection title="5. Data Sharing">
              <PolicyText>We do not sell personal data.</PolicyText>
              <PolicyText>We may share information with trusted third parties only where necessary to:</PolicyText>
              <PolicyList ordered={false} items={["Process payments", "Deliver platform functionality", "Provide analytics and technical support", "Comply with legal obligations", "Protect rights, users, or platform security"]} />
            </PolicySection>

            <PolicySection title="6. Data Security">
              <PolicyText>We implement commercially reasonable administrative, technical, and organizational safeguards to protect user information.</PolicyText>
              <PolicyText>However, no online system can guarantee absolute security.</PolicyText>
              <PolicyText>Users are responsible for maintaining the confidentiality of their login credentials.</PolicyText>
            </PolicySection>

            <PolicySection title="7. Data Retention">
              <PolicyText>We retain personal information only as long as reasonably necessary to:</PolicyText>
              <PolicyList items={["Provide services", "Fulfill legal/accounting obligations", "Resolve disputes", "Enforce agreements"]} />
            </PolicySection>

            <PolicySection title="8. Your Rights">
              <PolicyText>Subject to applicable law, users may have rights to:</PolicyText>
              <PolicyList items={["Access their personal data", "Request correction of inaccurate data", "Request deletion of personal data", "Withdraw consent to certain processing", "Opt out of marketing communications"]} />
              <PolicyText>Requests may be submitted through official support channels.</PolicyText>
            </PolicySection>

            <PolicySection title="9. Third-Party Links & Services">
              <PolicyText>Our platform may contain links to third-party websites, tools, or services.</PolicyText>
              <PolicyText>We are not responsible for the privacy practices or content of external third parties.</PolicyText>
            </PolicySection>

            <PolicySection title="10. Children’s Privacy">
              <PolicyText>Our services are not intended for individuals under the age of majority in their jurisdiction without parental/guardian supervision.</PolicyText>
            </PolicySection>

            <PolicySection title="11. Policy Updates">
              <PolicyText>We reserve the right to update this Privacy Policy periodically.</PolicyText>
              <PolicyText>Updated versions become effective upon publication on our platform or website.</PolicyText>
              <PolicyText>Continued use of our services constitutes acceptance of revised terms.</PolicyText>
            </PolicySection>

            <PolicySection title="Our Certification Policy">
              <PolicyText>At Global Digital Assets Academy, we do not issue certificates of completion for our educational programs.</PolicyText>
              <PolicyText>This decision is intentional and reflects our philosophy that financial markets reward competence, discipline, and execution, not symbolic credentials.</PolicyText>
              <PolicyText>Our mission is to equip students with practical market knowledge, strategic understanding, and disciplined decision-making frameworks for real-world market participation. While certificates may recognize course completion, they do not measure a participant’s ability to apply concepts effectively under live market conditions.</PolicyText>
              <PolicyText>For this reason, our academy prioritizes:</PolicyText>
              <PolicyList items={["Practical understanding over passive completion", "Skill development over credential collection", "Real-world application over symbolic validation"]} />
              <PolicyText>We believe true proficiency in the markets is demonstrated through disciplined execution, risk management, and consistent application of sound principles, and not through certificates.</PolicyText>
              <PolicyText>Students who complete our programs leave with something more valuable than a document:</PolicyText>
              <PolicyText>A structured framework for approaching financial markets with professionalism and discipline.</PolicyText>
            </PolicySection>

            <PolicySection title="Refund Policy">
              <PolicyText>Due to the digital nature of our educational products and the immediate access granted upon purchase, all sales are generally final unless otherwise stated.</PolicyText>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Refund Eligibility</h3>
                <PolicyText>Refunds may only be considered where:</PolicyText>
                <PolicyList items={["A duplicate payment has been made in error", "Technical issues on our platform prevent access and cannot be reasonably resolved", "A refund guarantee was explicitly stated for the purchased offer"]} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Non-Refundable Circumstances</h3>
                <PolicyText>Refunds will not be issued for:</PolicyText>
                <PolicyList items={["Change of mind after purchase", "Failure to complete a course", "Dissatisfaction based on unmet financial expectations", "Failure to review course descriptions before purchase", "Inability to access due to user-side technical/device limitations"]} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Refund Request Process</h3>
                <PolicyText>Eligible refund requests must be submitted through official support channels within the applicable refund window stated at purchase.</PolicyText>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Chargebacks</h3>
                <PolicyText>Initiating an unjustified chargeback without first contacting support may result in suspension or termination of platform access.</PolicyText>
              </div>
            </PolicySection>

            <PolicySection title="Risk Disclaimer">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Financial Risk Disclaimer</h3>
                <PolicyText>Global Digital Assets Academy provides educational content only.</PolicyText>
                <PolicyText>Nothing presented within our platform, courses, materials, mentorship, or communications constitutes:</PolicyText>
                <PolicyList items={["Financial advice", "Investment advice", "Trading advice", "Legal or tax advice", "Portfolio management services"]} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-950">Market Risk Warning</h3>
                <PolicyText>Participation in financial markets including digital assets, forex, stocks, cryptocurrency, and derivatives carries substantial risk and may result in partial or total loss of capital.</PolicyText>
                <PolicyText>Past performance, examples, or hypothetical scenarios do not guarantee future results. Students are solely responsible for:</PolicyText>
                <PolicyList items={["Their trading/investment decisions", "Their financial risk management", "Their independent due diligence"]} />
                <PolicyText>You should never risk capital you cannot afford to lose.</PolicyText>
              </div>
            </PolicySection>

            <PolicySection title="Contact">
              <PolicyText>For privacy-related inquiries or requests, please contact us through the official support channels listed on our platform/website.</PolicyText>
            </PolicySection>
          </div>
        </main>
      </div>
      <MinimalFooter />
    </>
  );
}
