import Link from "next/link";

import { MinimalFooter } from "@/components/ui/minimal-footer";
import { Nav } from "@/components/ui/Nav";
import { AuroraHero } from "@/components/ui/AuroraHero";
import { Button } from "@/components/ui/button";
import { CatalogWorkspace } from "@/components/CatalogWorkspace";

export default function HomePage() {
  return (
    <>
      <div className="dark">
        <Nav />
        <AuroraHero>
          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-center text-6xl font-medium tracking-tight text-zinc-100 drop-shadow-sm md:text-7xl xl:text-[5.25rem]">
            Explore the <span className="text-[#068365]">Catalog</span>
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-center text-lg text-zinc-400">
            Build practical digital asset knowledge with structured courses designed to connect strategy, tools, and confident execution.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="rounded-[14px] border border-white/10 bg-white/5 p-0.5 shadow-xl">
              <Button asChild size="lg" className="rounded-xl bg-[#F57C00] px-5 text-base font-medium text-white transition-colors duration-200 hover:bg-[#E65100]">
                <Link href="/sign-up">Enroll</Link>
              </Button>
            </div>
            <Button asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5 text-zinc-400 duration-200 hover:bg-white/5 hover:text-zinc-200">
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </AuroraHero>
      </div>
      <CatalogWorkspace />
      <MinimalFooter />
    </>
  )
}