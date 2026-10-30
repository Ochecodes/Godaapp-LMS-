"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridItemType {
  tag: string;
  category: string;
  courseSlug: string;
  title: string;
  desc: string;
  badge: string;
  innerImageSrc: string;
  price: string;
}

const GRID_ITEMS: GridItemType[] = [
  {
    tag: "Udoyen Peter Snr",
    category: "Crypto Markets",
    courseSlug: "cryptocurrency-market-and-trading-fundamentals",
    title: "Cryptocurrency Market and Trading Fundamentals",
    desc: "This course introduces the tools and concepts traders use to interpret market behaviour, understand liquidity, analyse price charts, and manage exposure to risk. You will also examine common security threats, trading mistakes, and the importance of disciplined decision-making.",
    badge: "Free",
    innerImageSrc: "/CryptoMarIMGCourse.jpg",
    price: "$0"
  },
  {
    tag: "Udoyen Peter Snr",
    category: "Forex Trading",
    courseSlug: "forex-trading-and-beginners-fundamentals",
    title: "Forex Trading and Beginner Fundamentals",
    desc: "Understand how the foreign exchange market operates, from currency pairs, pips, and lot sizes to market sessions, price movements, and trading platforms. This course explores technical and fundamental analysis, economic events, leverage, and the practical mechanics of executing trades. It also examines risk management and the common weaknesses that can undermine trading decisions.",
    badge: "Free",
    innerImageSrc: "/ForexTradIMGCourse.jpg",
    price: "$0"
  },
  {
    tag: "Udoyen Peter Snr",
    category: "Trading Psychology",
    courseSlug: "risk-management-trading-psychology",
    title: "Risk Management & Trading Psychology",
    desc: "Develop a disciplined approach to managing trading risk, protecting capital, and making decisions under pressure. This course examines position sizing, risk-to-reward ratios, drawdowns, exposure control, and capital preservation alongside the psychological challenges of fear, greed, overtrading, and revenge trading. You will explore practical methods for evaluating risk, controlling emotional responses, and building a structured trading process.",
    badge: "Paid",
    innerImageSrc: "/RistMangIMGCourse.jpg",
    price: "$30"
  },
  {
    tag: "Udoyen Peter Snr",
    category: "Forex Trading",
    courseSlug: "capital-management-and-prop-firm-preparation",
    title: "Capital Management and Prop Firm Preparation",
    desc: "This course examines prop firm evaluation models, profit targets, drawdown limits, risk restrictions, consistency requirements, and the rules that govern funded accounts. You will explore how to prepare for evaluations, control exposure, manage trading pressure, and develop a structured plan for operating within firm-specific conditions. The focus is on understanding the responsibilities and constraints of prop trading, making informed decisions, and preserving capital rather than pursuing funding at any cost.",
    badge: "Paid",
    innerImageSrc: "/CapiPropIMGCourse.jpg",
    price: "$30"
  },
  {
    tag: "Oche Akor",
    category: "Crypto Markets",
    courseSlug: "introduction-to-portfolio-management-and-copy-trading",
    title: "Introduction to Portfolio Management and Copy Trading",
    desc: "This course explores asset allocation, diversification, portfolio performance, and risk management, alongside the principles of copy trading and how investors assess traders before following their strategies. You will develop a clearer understanding of how individual investment decisions influence overall portfolio performance, the risks involved in copying trades, and the importance of making informed choices rather than relying solely on another investor’s decisions.",
    badge: "Paid",
    innerImageSrc: "/PortIMGCourse.jpg",
    price: "$50"
  },
  {
    tag: "Oche Akor",
    category: "Algorithmic Trading using PineScript",
    courseSlug: "algorithmic-trading-using-pinescript",
    title: "Algorithmic Trading using PineScript",
    desc: "Learn how to develop, test, and refine rule-based trading strategies using Pine Script on TradingView. This course explores Pine Script fundamentals, indicator development, strategy logic, entry and exit conditions, trade alerts, and backtesting. You will examine how to translate trading ideas into code, evaluate strategy performance against historical market data, and identify limitations that can affect real-world results. The focus is on building a structured understanding of trading automation, systematic strategy development, and the role of coding in making trading decisions more consistent and measurable.",
    badge: "Paid",
    innerImageSrc: "/AlgoTradIMGCourse.jpg",
    price: "$100"
  }
];

interface FeaturedCoursesProps {
  searchQuery?: string;
  selectedCourse?: string | null;
  onClearSelection?: () => void;
  compact?: boolean;
}

export default function FeaturedCourses({ searchQuery = '', selectedCourse = null, onClearSelection, compact = false }: FeaturedCoursesProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = GRID_ITEMS.filter((item) =>
    (!selectedCourse || item.category === selectedCourse) &&
    [item.category, item.title, item.desc].some((value) => value.toLowerCase().includes(normalizedQuery))
  );

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
        <img 
          src="/Zincbg.svg"
          alt="" 
          className="w-full h-full object-cover object-center" 
          loading="eager"
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
        "relative z-20 mx-auto max-w-7xl",
        compact ? "px-4 py-3 sm:px-6 sm:py-4" : "px-6 py-24 md:py-32",
      )}>
        
        {/* Relative wrapper holding the grid to safely anchor the absolute side tab */}
        <div className="relative w-full">

          {selectedCourse && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white/90 px-4 py-3">
              <p className="text-sm font-medium text-zinc-800">Selected course: {selectedCourse}</p>
              {onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-sm font-semibold text-[#068365] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                >
                  Show all courses
                </button>
              )}
            </div>
          )}
          
          {filteredItems.length > 0 ? (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 w-full justify-center", compact && "gap-5")}>
            {filteredItems.map((item: GridItemType) => {
              const isExpanded = expandedCourse === item.category;

              return (
              <div key={item.title} id={getCourseId(item.category)} className="w-full group scroll-mt-8">
                
                <div className={cn("relative border border-zinc-200/80 overflow-hidden bg-white rounded-xl flex flex-col hover:border-zinc-300 transition-all duration-300 shadow-xl shadow-zinc-900/[0.03]", selectedCourse === item.category && "border-[#068365]/60 ring-2 ring-[#068365]/20")}>
                  
                  {/* Course Card Preview Screenshot Area */}
                  <div className={cn("flex justify-center relative", compact ? "p-3" : "p-4")}>
                    <div className={cn("relative aspect-[3/2] w-full max-h-[360px] overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50", !compact && "max-h-[420px]")}>
                      <img 
                        src={item.innerImageSrc} 
                        alt={item.title} 
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
                    <div className="flex justify-between items-center">
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
                        <Link
                          href={`/sign-up?course=${encodeURIComponent(item.courseSlug)}`}
                          className="flex items-center rounded-lg bg-[#F57C00] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#E65100] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F57C00]/60"
                        >
                          Enroll <ArrowRight className="ml-1.5 size-3" aria-hidden="true" />
                        </Link>
                        <span className="text-base font-bold text-[#068365] tracking-tight">
                          {item.price}
                        </span>
                      </div>

                      <span className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border ${
                        item.badge === 'Free' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  {compact && isExpanded && (
                    <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Course lessons</h4>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {[1, 2, 3, 4].map((lesson) => {
                          const locked = lesson === 4;

                          return (
                            <li key={lesson}>
                              <Link
                                href={`/sign-up?course=${encodeURIComponent(item.courseSlug)}`}
                                className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365]"
                              >
                                <span>Lesson {lesson}{locked ? " (Locked)" : ""}</span>
                                {locked && <LockKeyhole className="size-3.5 text-zinc-500" aria-hidden="true" />}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
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
    href="#catalog"
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
