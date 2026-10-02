function BentoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`flex min-h-52 flex-col rounded-lg border border-zinc-300/80 bg-transparent p-6 sm:min-h-56 sm:p-8 ${className}`}>
      <h3 className="text-xl font-bold text-zinc-950 sm:text-2xl">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
        {children}
      </div>
    </article>
  );
}

export default function Wwd1() {
  return (
    <section className="relative isolate overflow-hidden border-t border-zinc-200/60 bg-white text-zinc-950">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/Zincbg.svg"
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          <BentoCard title="Our Vision" className="md:col-span-5">
            <p>A world where individuals confidently build wealth through digital assets with knowledge, discipline, and clarity.</p>
          </BentoCard>

          <BentoCard title="Our Mission" className="md:col-span-7">
            <p>To transform financial outcomes by designing and delivering structured, data-driven education systems that empower individuals to trade, invest, and grow wealth sustainably in the digital economy.</p>
          </BentoCard>

          <BentoCard title="Our Position" className="md:col-span-7">
            <p className="text-base font-medium text-zinc-800 sm:text-lg">We don’t just teach about trading; we build systems that produce disciplined, consistent traders.</p>
          </BentoCard>

          <BentoCard title="Our Core Values" className="md:col-span-5">
            <p>
              We focus on measurable trading improvement and profitability,
              prioritize structure over speculation, ensure that knowledge is the
              foundation of success, show students that decisions must be backed
              by analysis, sustainable success beats quick wins, and make digital
              asset education available to all.
            </p>
          </BentoCard>

          <div className="flex min-h-64 flex-col justify-end px-2 py-8 text-left md:col-span-7 md:col-start-6 md:min-h-72 md:px-8">
            <h2 className="max-w-none text-2xl font-bold leading-[1.05] text-zinc-950 sm:text-4xl lg:text-5xl">
              <span className="block lg:whitespace-nowrap">We Connect Knowledge,</span>
              <span className="block lg:whitespace-nowrap">Strategy, and Execution</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              Practical education, structured systems, and disciplined action work together to support confident, sustainable growth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
