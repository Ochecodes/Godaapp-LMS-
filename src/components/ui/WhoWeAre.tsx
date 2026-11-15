import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function WhoWeAre() {
  return (
    <ScrollReveal direction="top" duration={180}>
      <section aria-label="Who we are" className="bg-white pb-8 pt-2 text-zinc-950 sm:pb-12 sm:pt-3 lg:pb-16 lg:pt-4">
        <div className="mx-auto max-w-6xl px-8 sm:px-12 lg:px-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[1.15] overflow-hidden rounded-2xl bg-background">
              <Image
                alt="A member of the GodaApp community"
                className="object-cover object-[center_38%]"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                src="/WhoWeAre.avif"
              />
            </div>

            <div className="max-w-2xl space-y-5 text-base leading-7 text-zinc-700 sm:text-lg sm:leading-8">
              <p>
                GodaApp is a financial education platform helping people build a stronger
                foundation in digital asset markets.
              </p>
              <p>
                We do this through{" "}
                <strong className="font-semibold text-zinc-950">
                  structured learning, practical market knowledge, and disciplined decision-making
                </strong>
                —so learners can grow their understanding with greater confidence.
              </p>
              <p>
                Our goal is to make digital-asset education clearer, more accessible, and
                grounded in skills learners can apply in the real world.
              </p>
              <Button
                asChild
                className="mt-2 bg-[#068365] text-white hover:bg-[#056d53]"
                size="lg"
              >
                <Link href="/about">About us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
