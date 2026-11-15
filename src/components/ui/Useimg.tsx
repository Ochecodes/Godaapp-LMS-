import Link from "next/link";
import Image from "next/image";

const communityImages = [
  { src: "/students.avif", alt: "Students learning together" },
  { src: "/Nigerian.avif", alt: "GodaApp trader" },
  { src: "/American.avif", alt: "GodaApp community member" },
  { src: "/Asian.avif", alt: "GodaApp community member" },
  { src: "/boy.avif", alt: "Young digital asset learner" },
  { src: "/girl.avif", alt: "Digital asset learner" },
  { src: "/engineer.avif", alt: "GodaApp systems builder" },
  { src: "/man.avif", alt: "GodaApp trader" },
  { src: "/team.avif", alt: "GodaApp team" },
  { src: "/Capital.avif", alt: "GodaApp learning community" },
];

export default function Useimg() {
  return (
    <section className="relative isolate overflow-hidden border-t border-zinc-200/60 bg-white text-zinc-950">
      <style>{`
        @keyframes community-wave {
          0%, 100% { transform: translateY(0) scale(1); }
          45% { transform: translateY(-10px) scale(1.05); }
        }
        .community-orbit {
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          align-items: center;
          gap: 1rem;
        }
        .community-heading {
          max-width: 100%;
        }
        .community-bubble {
          position: relative;
          display: block;
          aspect-ratio: 1;
          width: 100%;
          max-width: 6.5rem;
          justify-self: center;
          overflow: hidden;
          border: 5px solid rgba(245, 124, 0, 0.72);
          border-radius: 9999px;
          background: #f8fafc;
          box-shadow: 0 18px 35px rgba(30, 41, 59, 0.12);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .community-bubble:hover {
          z-index: 2;
          transform: scale(1.06);
          box-shadow: 0 22px 42px rgba(30, 41, 59, 0.2);
        }
        .community-orbit:has(.community-bubble:hover) .community-bubble {
          animation: community-wave 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(1) { animation-delay: 0ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(2) { animation-delay: 20ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(3) { animation-delay: 40ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(4) { animation-delay: 60ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(5) { animation-delay: 80ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(6) { animation-delay: 100ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(7) { animation-delay: 120ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(8) { animation-delay: 140ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(9) { animation-delay: 160ms; }
        .community-orbit:has(.community-bubble:hover) .community-bubble:nth-child(10) { animation-delay: 180ms; }
        @media (prefers-reduced-motion: reduce) {
          .community-bubble,
          .community-orbit:has(.community-bubble:hover) .community-bubble {
            animation: none;
            transition: none;
          }
        }
        .community-bubble img {
          height: 100%;
          width: 100%;
          object-fit: cover;
        }
        @media (max-width: 1023px) {
          .community-orbit {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            row-gap: 1.25rem;
          }
        }
        @media (max-width: 767px) {
          .community-heading {
            gap: 0.25rem;
            font-size: 0.92rem;
          }
          .community-orbit {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
          }
          .community-bubble {
            max-width: 6rem;
          }
        }
      `}</style>

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

      <div className="mx-auto max-w-6xl px-8 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-16">
        <header className="max-w-full text-center">
          <h2 className="community-heading flex items-center justify-center gap-2 whitespace-nowrap text-lg font-medium leading-tight text-zinc-950 sm:text-2xl">
            <span>Learn alongside a growing community</span>
            <Link
              href="/sign-up"
              aria-label="Join the GodaApp community"
              className="shrink-0 text-sm font-semibold text-[#068365] transition-colors hover:text-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365] focus-visible:ring-offset-2 sm:text-base"
            >
              Get Started
            </Link>
          </h2>
        </header>

        <div className="community-orbit mx-auto mt-8 max-w-5xl sm:mt-10" aria-label="GodaApp community members">
          {communityImages.map((image) => (
            <figure key={image.src} className="community-bubble">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 767px) 33vw, (max-width: 1023px) 20vw, 10vw"
                className="object-cover"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
