import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

function StepMarker({ number }: { number: number }) {
  return (
    <Button
      className="mt-5 w-fit cursor-default border-[#F57C00] bg-[#F57C00] text-white hover:bg-[#F57C00] disabled:opacity-100"
      disabled
      size="sm"
      type="button"
      variant="default"
    >
      Step {number}
    </Button>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="bg-white pb-2 pt-12 text-zinc-950 sm:pb-3 sm:pt-16 lg:pb-4 lg:pt-20">
      <div className="mx-auto max-w-6xl px-8 sm:px-12 lg:px-16">
        <header className="mb-8 text-center">
          <h2
            className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[#068365] sm:text-5xl"
            id="how-it-works-title"
          >
            Start learning in three simple steps
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-normal leading-relaxed text-zinc-600">
            Create an account, choose a learning path, and build practical skills at your pace.
          </p>
        </header>

        <ol
          aria-label="Three steps to get started"
          className="grid gap-5 lg:grid-cols-2"
        >
          <li className="lg:col-span-2">
            <ScrollReveal direction="top">
              <article className="grid overflow-hidden rounded-2xl border border-[#F57C00] bg-white shadow-none lg:min-h-[24rem] lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex flex-col items-start justify-center p-5 sm:p-8 lg:p-10">
                  <StepMarker number={1} />
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Create your learner account
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                    Sign up for GodaApp to set up your learner profile and open your personal
                    dashboard.
                  </p>
                </div>
                <div className="bg-white p-4 sm:p-5">
                  <div className="relative min-h-56 overflow-hidden rounded-xl bg-muted sm:min-h-72 lg:h-full">
                    <Image
                      alt="A learner signing in to her digital assets course"
                      className="object-cover"
                      fill
                      priority={false}
                      sizes="(max-width: 1023px) 100vw, 60vw"
                      src="/Step1.avif"
                    />
                  </div>
                </div>
              </article>
            </ScrollReveal>
          </li>

          <li>
            <ScrollReveal className="h-full" direction="left" delay={0.04}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#F57C00] bg-white shadow-none">
                <div className="flex flex-1 flex-col items-start p-5 sm:p-7">
                  <StepMarker number={2} />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
                    Choose your learning path
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Explore practical digital-asset courses and pick a track that fits your goals.
                  </p>
                </div>
                <div className="bg-white p-4 sm:p-5">
                  <div className="relative min-h-52 overflow-hidden rounded-xl bg-muted sm:min-h-60">
                    <Image
                      alt="Learners exploring a course together"
                      className="object-cover"
                      fill
                      sizes="(max-width: 1023px) 100vw, 45vw"
                      src="/Step2.avif"
                    />
                  </div>
                </div>
              </article>
            </ScrollReveal>
          </li>

          <li>
            <ScrollReveal className="h-full" direction="right" delay={0.08}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#F57C00] bg-white shadow-none">
                <div className="bg-white p-4 sm:p-5">
                  <div className="relative min-h-52 overflow-hidden rounded-xl bg-muted sm:min-h-60">
                    <Image
                      alt="Students learning together"
                      className="object-cover"
                      fill
                      sizes="(max-width: 1023px) 100vw, 45vw"
                      src="/Step3.avif"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-start p-5 sm:p-7">
                  <StepMarker number={3} />
                  <h3 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
                    Learn, practice, and grow
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Follow video lessons, take interactive check-ins, and track your progress as you
                    build confidence.
                  </p>
                </div>
              </article>
            </ScrollReveal>
          </li>
        </ol>
      </div>
    </section>
  );
}
