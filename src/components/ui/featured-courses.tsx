"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, ChevronUp, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalogStore } from '@/lib/catalog-store';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface GridItemType {
  tag: string;
  category: string;
  courseSlug: string;
  title: string;
  desc: string;
  innerImageSrc: string;
  price: string;
}

type FeaturedCourseDetails = {
  priceUSD: number;
  originalPriceUSD: number | null;
  lessons: {
    id: number;
    title: string;
    isPreview: boolean;
  }[];
};

const GRID_ITEMS: GridItemType[] = [
  {
    tag: "Godaapp",
    category: "Crypto Markets",
    courseSlug: "cryptocurrency-market-and-trading-fundamentals",
    title: "Cryptocurrency Market and Trading Fundamentals",
    desc: "This course introduces the tools and concepts traders use to interpret market behaviour, understand liquidity, analyse price charts, and manage exposure to risk. You will also examine common security threats, trading mistakes, and the importance of disciplined decision-making.",
    innerImageSrc: "/CryptoMarIMGCourse.avif",
    price: "$9.98"
  },
  {
    tag: "Godaapp",
    category: "Forex Trading",
    courseSlug: "forex-trading-and-beginners-fundamentals",
    title: "Forex Trading and Beginner Fundamentals",
    desc: "Understand how the foreign exchange market operates, from currency pairs, pips, and lot sizes to market sessions, price movements, and trading platforms. This course explores technical and fundamental analysis, economic events, leverage, and the practical mechanics of executing trades. It also examines risk management and the common weaknesses that can undermine trading decisions.",
    innerImageSrc: "/ForexTradIMGCourse.avif",
    price: "$9.98"
  },
  {
    tag: "Godaapp",
    category: "Trading Psychology",
    courseSlug: "risk-management-trading-psychology",
    title: "Risk Management & Trading Psychology",
    desc: "Develop a disciplined approach to managing trading risk, protecting capital, and making decisions under pressure. This course examines position sizing, risk-to-reward ratios, drawdowns, exposure control, and capital preservation alongside the psychological challenges of fear, greed, overtrading, and revenge trading. You will explore practical methods for evaluating risk, controlling emotional responses, and building a structured trading process.",
    innerImageSrc: "/RistMangIMGCourse.avif",
    price: "$8.88"
  },
  {
    tag: "Godaapp",
    category: "Forex Trading",
    courseSlug: "capital-management-and-prop-firm-preparation",
    title: "Capital Management and Prop Firm Preparation",
    desc: "This course examines prop firm evaluation models, profit targets, drawdown limits, risk restrictions, consistency requirements, and the rules that govern funded accounts. You will explore how to prepare for evaluations, control exposure, manage trading pressure, and develop a structured plan for operating within firm-specific conditions. The focus is on understanding the responsibilities and constraints of prop trading, making informed decisions, and preserving capital rather than pursuing funding at any cost.",
    innerImageSrc: "/CapiPropIMGCourse.avif",
    price: "$9.98"
  },
  {
    tag: "Godaapp",
    category: "Crypto Markets",
    courseSlug: "introduction-to-portfolio-management-and-copy-trading",
    title: "Introduction to Portfolio Management and Copy Trading",
    desc: "This course explores asset allocation, diversification, portfolio performance, and risk management, alongside the principles of copy trading and how investors assess traders before following their strategies. You will develop a clearer understanding of how individual investment decisions influence overall portfolio performance, the risks involved in copying trades, and the importance of making informed choices rather than relying solely on another investor’s decisions.",
    innerImageSrc: "/PortIMGCourse.avif",
    price: "$11.98"
  },
  {
    tag: "Godaapp",
    category: "Algorithmic Trading using PineScript",
    courseSlug: "algorithmic-trading-using-pinescript",
    title: "Algorithmic Trading using PineScript",
    desc: "Learn how to develop, test, and refine rule-based trading strategies using Pine Script on TradingView. This course explores Pine Script fundamentals, indicator development, strategy logic, entry and exit conditions, trade alerts, and backtesting. You will examine how to translate trading ideas into code, evaluate strategy performance against historical market data, and identify limitations that can affect real-world results. The focus is on building a structured understanding of trading automation, systematic strategy development, and the role of coding in making trading decisions more consistent and measurable.",
    innerImageSrc: "/AlgoTradIMGCourse.avif",
    price: "$11.98"
  }
];

interface FeaturedCoursesProps {
  compact?: boolean;
}

async function fetchFeaturedCourseDetails(): Promise<Record<string, FeaturedCourseDetails>> {
  const response = await fetch('/api/catalog/featured-courses');
  if (!response.ok) {
    throw new Error(`Course details request failed (${response.status}).`);
  }
  return response.json() as Promise<Record<string, FeaturedCourseDetails>>;
}

export default function FeaturedCourses({ compact = false }: FeaturedCoursesProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const searchQuery = useCatalogStore((state) => state.searchQuery);
  const selectedCourse = useCatalogStore((state) => state.selectedCourse);
  const clearSelectedCourse = useCatalogStore((state) => state.clearSelectedCourse);
  const {
    data: courseDetails = {},
    isPending: courseDetailsPending,
    isError: hasCourseDetailsError,
  } = useQuery({
    queryKey: ['featured-course-details'],
    queryFn: fetchFeaturedCourseDetails,
  });
  const courseDetailsLoaded = !courseDetailsPending;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = GRID_ITEMS.filter((item) =>
    (!selectedCourse || item.category === selectedCourse) &&
    [item.category, item.title, item.desc].some((value) => value.toLowerCase().includes(normalizedQuery))
  );

  function getStaticPrice(price: string) {
    const parsedPrice = Number(price.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsedPrice) ? parsedPrice : 0;
  }

  function formatPrice(price: number) {
    return `$${price.toFixed(2)}`;
  }

  function getCourseId(category: string) {
    return `course-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  return (
    <div id="catalog" className={cn("relative w-full overflow-hidden bg-transparent text-zinc-950 min-h-150 border-t border-zinc-200/50", compact && "min-h-0")}>
      
      {/* 
        ========================================================================
        FULL-BLEED BACKGROUND SVG IMAGE LAYER
        ========================================================================
      */}
      <div className="absolute inset-0 w-full h-full -z-10 select-none pointer-events-none">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/Zincbg.svg')" }}
        />
        
        {/* Soft Noise Texture Mask Overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://w3.org' id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* 
        ========================================================================
        4-CARD GRID CONTAINER MAXIMIZED TO 7XL
        ========================================================================
      */}
      <div className={cn(
        "relative z-20 mx-auto max-w-6xl",
        compact ? "px-4 py-3 sm:px-6 sm:py-4" : "px-8 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-16",
      )}>
        
        {/* Relative wrapper holding the grid to safely anchor the absolute side tab */}
        <div className="relative w-full">

          {!compact && (
            <header className="mb-8 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Explore our courses
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-normal leading-relaxed text-zinc-600">
                Build practical knowledge and develop a more disciplined approach to digital asset markets.
              </p>
            </header>
          )}

          {selectedCourse && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white/90 px-4 py-3">
              <p className="text-sm font-medium text-zinc-800">Selected course: {selectedCourse}</p>
              <button
                type="button"
                onClick={clearSelectedCourse}
                className="text-sm font-semibold text-[#068365] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
              >
                Show all courses
              </button>
            </div>
          )}

          {hasCourseDetailsError && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              Live course prices and lesson previews could not be loaded.
            </p>
          )}
          
          {filteredItems.length > 0 ? (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 w-full justify-center", compact && "gap-5")}>
            {filteredItems.map((item: GridItemType, index: number) => {
              const isExpanded = expandedCourse === item.category;
              const details = courseDetails[item.courseSlug];
              const currentPrice = details?.priceUSD ?? getStaticPrice(item.price);
              const originalPrice = details
                ? details.originalPriceUSD
                : currentPrice > 0 ? currentPrice * 2 : null;
              const isHalfPrice = originalPrice !== null &&
                Math.round(originalPrice * 100) === Math.round(currentPrice * 200);
              const courseIsPublished = Boolean(details);

              return (
              <ScrollReveal
                key={item.title}
                className="group h-full w-full scroll-mt-8"
                delay={Math.min(index * 0.05, 0.25)}
                direction="bottom"
                id={getCourseId(item.category)}
              >
                
                <div className={cn("relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-none transition-all duration-300 hover:border-zinc-300", selectedCourse === item.category && "border-[#068365]/60 ring-2 ring-[#068365]/20")}>
                  
                  {/* Course Card Preview Screenshot Area */}
                  <div className={cn("flex justify-center relative", compact ? "p-3" : "p-4")}>
                    <div className={cn("relative aspect-[3/2] w-full max-h-[360px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50", !compact && "max-h-[420px]")}>
                      <Image
                        src={item.innerImageSrc} 
                        alt={item.title} 
                        width={720}
                        height={480}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="relative z-0 h-full w-full object-contain object-center"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
                  
                  {/* Card Content Matrix */}
                  <div className={compact ? "p-4" : "p-6"}>
                    <span className="inline-block px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-semibold tracking-wide uppercase mb-3 border border-zinc-200">
                      {item.tag}
                    </span>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-1.5 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-zinc-600 mb-6 leading-relaxed text-sm h-12 overflow-hidden text-ellipsis">
                      {item.desc}
                    </p>
                    
                    {/* Action row layout */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {compact && (
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedCourse(isExpanded ? null : item.category)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#F57C00] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#E65100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F57C00]/60"
                          >
                            {isExpanded ? "Hide lessons" : "Explore lessons"}
                            {isExpanded ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <BookOpen className="size-3.5" aria-hidden="true" />}
                          </button>
                        )}
                        {courseIsPublished ? (
                          <Link
                            href={`/sign-up?course=${encodeURIComponent(item.courseSlug)}`}
                            className="button-shake flex items-center rounded-lg bg-[#F57C00] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#E65100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F57C00]/60"
                          >
                            Enroll <ArrowRight className="ml-1.5 size-3" aria-hidden="true" />
                          </Link>
                        ) : courseDetailsLoaded ? (
                          <span className="text-xs font-medium text-zinc-500">Not yet available</span>
                        ) : (
                          <Link
                            href={`/sign-up?course=${encodeURIComponent(item.courseSlug)}`}
                            className="button-shake flex items-center rounded-lg bg-[#F57C00] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#E65100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F57C00]/60"
                          >
                            Enroll <ArrowRight className="ml-1.5 size-3" aria-hidden="true" />
                          </Link>
                        )}
                        <span className="inline-flex flex-wrap items-baseline gap-2">
                          {originalPrice !== null && originalPrice > currentPrice && (
                            <del className="text-sm font-medium text-zinc-500">
                              {formatPrice(originalPrice)}
                            </del>
                          )}
                          <span className="text-base font-bold text-[#068365] tracking-tight">
                            {formatPrice(currentPrice)}
                          </span>
                          {isHalfPrice && (
                            <span className="text-[10px] font-semibold text-[#068365]">50% off</span>
                          )}
                        </span>
                      </div>

                    </div>
                  </div>

                  {compact && isExpanded && (
                    <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Course lessons</h4>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {details?.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <Link
                              href={`/dashboard/lessons/${lesson.id}`}
                              aria-label={lesson.isPreview ? `Preview lesson: ${lesson.title}` : `Unlock ${lesson.title}`}
                              className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                            >
                              <span className="min-w-0 truncate">{lesson.title}</span>
                              <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
                                {lesson.isPreview ? "Preview" : "Unlock"}
                                {lesson.isPreview
                                  ? <BookOpen className="size-3.5" aria-hidden="true" />
                                  : <LockKeyhole className="size-3.5" aria-hidden="true" />}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {details && details.lessons.length === 0 && (
                          <li className="px-2.5 py-2 text-sm text-zinc-500">
                            No lessons have been published for this course yet.
                          </li>
                        )}
                        {!details && (
                          <li className="px-2.5 py-2 text-sm text-zinc-500">
                            Lesson details appear when the course is published.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                </div>
                </ScrollReveal>
              );
            })}
            </div>
          ) : (
            <p role="status" className="rounded-lg border border-zinc-200 bg-white/90 px-4 py-8 text-center text-sm text-zinc-600">
              No courses match “{searchQuery}”. Try another search.
            </p>
          )}

          {/* 
            ========================================================================
            💡 REPLICATED GREEN VERTICAL SIDE BUTTON (EXPLORE COURSES)
            Pushed wide outside the card edges with translate-x-16 for maximum breathing room
            ========================================================================
          */}
          <div className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-24 z-30">
  <Link 
    href="/catalog"
    className="flex items-center justify-center bg-[#068365] hover:bg-[#056d53] text-zinc-100 hover:text-white font-bold text-xs rounded-xl px-5 py-4 shadow-zinc-900/[0.04] transition-all duration-200 border border-white/10 tracking-wider shadow-lg"
    style={{ writingMode: 'vertical-rl' }}
  >
    <div className="flex items-center rotate-180 text-nowrap select-none">
      <span>Explore courses</span>
    </div>
  </Link>
</div>

        </div>

      </div> 
    </div>
  );
}
