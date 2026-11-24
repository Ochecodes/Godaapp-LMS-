import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

const communityImages = [
  { src: "/American.avif", alt: "Godaapp community member" },
  { src: "/Nigerian.avif", alt: "Godaapp community member" },
  { src: "/Asian.avif", alt: "Godaapp community member" },
];

export default function Wwd() {
  return (
    <section className="relative isolate overflow-hidden border-t border-zinc-200/60 bg-white text-zinc-950">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/Zincbg.svg')" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative aspect-[1.05] overflow-hidden rounded-xl bg-zinc-100 shadow-xl shadow-zinc-900/10">
            <Image
              src="/ContactIMG.avif"
              alt="Global Digital Assets Academy community working together"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          <div className="absolute inset-x-4 bottom-4 flex min-h-20 items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg sm:inset-x-8 sm:bottom-8 sm:max-w-xs sm:px-5">
            <div className="flex shrink-0 items-center pl-1" aria-hidden="true">
              {communityImages.map((image, index) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  width={36}
                  height={36}
                  sizes="36px"
                  className={`size-9 rounded-full border-2 border-white object-cover ${index ? "-ml-3" : ""}`}
                />
              ))}
              <span className="-ml-3 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#068365] text-[11px] font-semibold text-white">
                50+
              </span>
            </div>
            <p className="text-sm font-semibold leading-snug text-zinc-900">
              Join our learning community
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase text-[#068365]">Who We Are</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-zinc-950 sm:text-4xl">
            Structure and discipline for a changing financial landscape
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-700 sm:text-lg">
            <p>
              Global Digital Assets Academy is a financial education and systems
              development institution focused on solving one of the biggest
              challenges in digital assets space: lack of structure and discipline.
            </p>
            <p>
              We operate at the intersection of digital assets &amp; markets
              structure, financial education, trading psychology, and data-driven
              decision-making. To deliver structured, scalable, and sustainable
              financial growth.
            </p>
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-600">
            Company registration number: RC9992443
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 rounded-lg bg-[#068365] px-5 font-semibold text-white transition-colors hover:bg-[#056d53]"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
