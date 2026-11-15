import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface TestimonialItemType {
  quote: string;
  name: string;
  role: string;
  imageSrc: string; // Points directly to your public folder assets
}

const TESTIMONIALS_DATA: TestimonialItemType[] = [
  {
    quote: "Since implementing taking the forex trading course by Goda, my trading productivity has increased by 80%. The intuitive interface and powerful learning automation features have transformed how I trade. The instructor support has been exceptional - they're always there when we need them.",
    name: "Chen Yen",
    role: "Forex Trader",
    imageSrc: "/Asian.avif"
  },
  {
    quote: "The analytics capabilities have given us unprecedented insights into my referrals. I've been able to make data-driven decisions that have directly impacted the number of potential students reached on social media. It's been a game-changer for my affiliate business.",
    name: "Sarah Jones",
    role: "Affiliate Marketer",
    imageSrc: "/American.avif"
  },
  {
    quote: "This platform has revolutionized how I see the crypto space for good. The tailored learning saved me hours on youtube each week, and I love the transparency in the lessons. It's rare to find an app like Goda that benefits both seasoned investors and newbies.",
    name: "Ifiok Thompson",
    role: "Crypto Investor",
    imageSrc: "/Nigerian.avif"
  }
];

export default function Testimonials() { 
  return (
    <section className="relative isolate w-full overflow-hidden bg-white py-8 text-zinc-950 sm:py-12 lg:py-16">
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
      <div className="relative z-10 mx-auto max-w-6xl px-8 sm:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold sentences tracking-wider text-[#068365]">
            Trusted by customers
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
            What our customers say
          </h2>
        </div>

        {/* Responsive Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((item: TestimonialItemType, index: number) => (
            <ScrollReveal
              key={index}
              className="h-full"
              delay={0.04 * index}
              direction={index === 0 ? "left" : index === 1 ? "bottom" : "right"}
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#09090b] p-8 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-white/20">
                <div>
                  <span className="mb-2 block text-3xl leading-none text-[#068365]">
                    “
                  </span>
                  <p className="text-sm font-normal leading-relaxed text-zinc-400">
                    {item.quote}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                  <Image
                    src={item.imageSrc}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl border border-white/10 bg-zinc-800 object-cover"
                    width={48}
                    height={48}
                    sizes="48px"
                  />
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-200">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-zinc-500">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
