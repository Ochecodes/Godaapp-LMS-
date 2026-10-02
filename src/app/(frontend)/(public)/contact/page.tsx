import Link from "next/link";

import { MinimalFooter } from "@/components/ui/minimal-footer";
import { Nav } from "@/components/ui/Nav";
import { AuroraHero } from "@/components/ui/AuroraHero";
import { Button } from "@/components/ui/button";
import ContactWithGlobe from "@/components/ui/ContactWithGlobe";
import { WorldMap } from "@/components/ui/map";

export default function HomePage() {
  return (
    <>
      <div className="dark">
        <Nav />
        <AuroraHero>
          <h1 className="mx-auto mt-8 w-full whitespace-nowrap text-center text-base font-medium tracking-tight text-zinc-100 drop-shadow-sm min-[375px]:text-xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl">
            Talk to the <span className="text-[#068365]">GodaApp</span> team
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-center text-lg text-zinc-400">
            Have a question about our courses or platform? Send us a message and
            we’ll be glad to hear from you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="rounded-[14px] border border-white/10 bg-white/5 p-0.5 shadow-xl">
              <Button asChild size="lg" className="rounded-xl bg-[#F57C00] px-5 text-base font-medium text-white transition-colors duration-200 hover:bg-[#E65100]">
                <Link href="/privacy-policy">Policies</Link>
              </Button>
            </div>
            <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5 text-zinc-400 duration-200 hover:bg-white/5 hover:text-zinc-200">
              <Link href="/affiliate">Referral Program</Link>
            </Button>
          </div>
        </AuroraHero>
      </div>
      <ContactWithGlobe />
      <section className="relative isolate w-full overflow-hidden pb-24 pt-0 text-zinc-950 sm:pb-32">
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
        <div className="relative mx-auto max-w-7xl px-6 pt-4 text-center sm:px-8 sm:pt-6">
          <h2 className="text-xl font-bold sm:text-4xl">Global Network of Learners</h2>
          <p className="mx-auto max-w-2xl py-4 text-sm text-zinc-600 sm:text-lg">
            Connect with traders worldwide. Our platform enables seamless learning
            collaboration across continents, bringing the world to your workspace.
          </p>
        </div>
        <WorldMap
          lineColor="#F57C00"
          mapBackgroundColor="transparent"
          labelClassName="text-[10px] leading-tight font-normal text-[#068365]"
          dots={[
            {
              start: { lat: 6.5244, lng: 3.3792, label: "Nigeria", labelOffset: { x: -28, y: -18 } },
              end: { lat: 34.0522, lng: -118.2437, label: "USA" },
            },
            {
              start: { lat: 6.5244, lng: 3.3792 },
              end: { lat: -15.7975, lng: -47.8919, label: "Brazil" },
            },
            {
              start: { lat: 24.4539, lng: 54.3773, label: "UAE" },
              end: { lat: 51.5074, lng: -0.1278, label: "UK" },
            },
            {
              start: { lat: -26.2041, lng: 28.0473, label: "South Africa" },
              end: { lat: 5.6037, lng: -0.187, label: "Ghana", labelOffset: { x: 28, y: 18 } },
            },
            {
              start: { lat: -1.2921, lng: 36.8219, label: "Kenya" },
              end: { lat: 43.6532, lng: -79.3832, label: "Canada" },
            },
            {
              start: { lat: 39.9042, lng: 116.4074, label: "China" },
              end: { lat: -33.8688, lng: 151.2093, label: "Australia" },
            },
          ]}
        />
      </section>
      <MinimalFooter />
    </>
  )
}