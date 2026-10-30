import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Nav } from "@/components/ui/Nav";

export function HeroSection() {
  return (
    <div className="dark relative min-h-screen text-white selection:bg-white/20">
      <style>{`
        @keyframes hero-background-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes hero-content-rise {
          from { opacity: 0; filter: blur(12px); transform: translateY(12px); }
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-background-fade, .hero-content-rise, .hero-actions-rise, .hero-preview-rise {
            animation: none !important;
            opacity: 1 !important;
            filter: none !important;
            transform: none !important;
          }
        }
      `}</style>
      <Nav />
      <main className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden isolate opacity-30 contain-strict lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.05)_0,hsla(0,0%,55%,.01)_50%,hsla(0,0%,45%,0)_80%)]" />
        </div>

        <section className="relative">
          <div className="relative pt-24 md:pt-36">
            <div
              className="hero-background-fade absolute inset-0 -z-30 h-full w-full overflow-hidden bg-black"
              style={{ animation: "hero-background-fade 1.5s ease both" }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="pointer-events-none h-full w-full object-cover object-center opacity-80"
              >
                <source src="/bg-hero.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 size-full bg-gradient-to-b from-black/10 via-zinc-950/40 to-zinc-950"
            />

            <div className="relative z-10 mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <div
                  className="hero-content-rise"
                  style={{
                    animation:
                      "hero-content-rise 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
                  }}
                >
                  <Link
                    href="/affiliate"
                    className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 bg-white/5 p-1 pl-4 text-zinc-300 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-white/10"
                  >
                    <span className="text-sm font-medium">
                      Introducing Our Affiliate Program
                    </span>
                    <span className="block h-4 w-0.5 bg-white/10" />
                    <div className="size-6 overflow-hidden rounded-full bg-white/10 duration-500 group-hover:bg-white/20">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-zinc-200" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-zinc-200" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-6xl font-medium tracking-tight text-zinc-100 drop-shadow-sm md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                    Tailored <span className="text-[#068365]">Courses</span> for
                    Digital Learners
                  </h1>

                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-zinc-400">
                    Premier ecosystem designed to break down digital asset
                    complexities through interactive learning paths.
                  </p>
                </div>

                <div
                  className="hero-actions-rise mt-12 flex flex-col items-center justify-center gap-3 md:flex-row"
                  style={{
                    animation:
                      "hero-content-rise 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.75s both",
                  }}
                >
                  <div className="rounded-[14px] border border-white/10 bg-white/5 p-0.5 shadow-xl">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-[#F57C00] px-5 text-base font-medium text-white transition-colors duration-200 hover:bg-[#E65100]"
                    >
                      <Link href="/catalog">
                        <span className="text-nowrap">Browse Courses</span>
                      </Link>
                    </Button>
                  </div>

                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5 text-zinc-400 duration-200 hover:bg-white/5 hover:text-zinc-200"
                  >
                    <Link href="/affiliate">
                      <span className="text-nowrap">Affiliate Program</span>
                    </Link>
                  </Button>
                </div>
              </div>

              <div
                className="hero-preview-rise"
                style={{
                  animation:
                    "hero-content-rise 2s cubic-bezier(0.22, 1, 0.36, 1) 0.75s both",
                }}
              >
                <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-zinc-950/30 to-zinc-950"
                  />
                  <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 p-4 shadow-2xl shadow-black/90 ring-1 ring-white/5 backdrop-blur-md">
                    <img
                      className="relative block w-full rounded-2xl border border-white/5"
                      alt="App screenshot"
                      src="/DashIMG.jpeg"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
