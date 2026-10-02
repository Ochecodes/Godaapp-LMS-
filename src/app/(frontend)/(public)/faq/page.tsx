import { MinimalFooter } from "@/components/ui/minimal-footer";
import { Nav } from "@/components/ui/Nav";
import FaqSection from "@/components/ui/faq-section";
import { AuroraHero } from "@/components/ui/AuroraHero";

export default function HomePage() {
  return (
    <>
      <div className="dark">
        <Nav />
        <AuroraHero>
          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-center text-6xl font-medium tracking-tight text-zinc-100 drop-shadow-sm md:text-7xl xl:text-[5.25rem]">
            Frequently Asked <span className="text-[#068365]">Questions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-balance text-center text-lg text-zinc-400">
            Find clear answers about learning with GodaApp and our digital asset
            education programs.
          </p>
        </AuroraHero>
      </div>
      <main>
          <FaqSection contactHeader />
      </main>
      <MinimalFooter />
    </>
  )
}
