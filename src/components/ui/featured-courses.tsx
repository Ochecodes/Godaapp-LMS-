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
    tag: "Goda",
    category: "Capital Preservation",
    courseSlug: "capital-preservation-survival-mindset",
    title: "Capital Preservation & Survival Mindset",
    desc: "In trading, survival comes before profitability. A trader who protects capital can continue learning, improving, and compounding over time. Learn how",
    badge: "Free",
    innerImageSrc: "/Capital.jpg",
    price: "$0"
  },
  {
    tag: "Goda",
    category: "Forex Trading",
    courseSlug: "forex-trading-beginners-fundamentals",
    title: "Forex Trading: Beginners Fundamentals",
    desc: "Forex trading rewards structure, not guesswork, and this course is built to give you that structure from the ground up.",
    badge: "Free",
    innerImageSrc: "/Forex.jpg",
    price: "$0"
  },
  {
    tag: "Goda",
    category: "Trading Psychology",
    courseSlug: "risk-management-trading-psychology",
    title: "Risk Management & Trading Psychology",
    desc: "Most traders dont fail because of strategy, they fail because of emotions & poor risk control. This course addresses the difference between survival and consistency.",
    badge: "Paid",
    innerImageSrc: "/Risk.jpg",
    price: "$49"
  },
  {
    tag: "Goda",
    category: "Crypto Markets",
    courseSlug: "cryptocurrency-market-trading-fundamentals",
    title: "Cryptocurrency Market & Trading Fundamentals",
    desc: "Cryptocurrency trading isnt just about buying and selling,its about understanding how the market truly works. This course gives you that foundation.",
    badge: "Paid",
    innerImageSrc: "/Crypto.jpg",
    price: "$99"
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
      <div className={cn("relative z-20 mx-auto max-w-7xl px-6 py-24 md:py-32", compact && "px-4 py-8 sm:px-6 sm:py-10")}>
        
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
                    <div className={cn("w-full rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden relative", compact ? "h-40" : "h-56")}>
                      <img 
                        src={item.innerImageSrc} 
                        alt={item.title} 
                        className="w-full h-full object-cover object-center relative z-0" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      
                      {/* Transparent Teal Color Tint Overlay layer */}
                      <div className="absolute inset-0 bg-[#068365]/15 pointer-events-none mix-blend-multiply transition-opacity duration-300 group-hover:opacity-20 z-10" />
                      
                      {/* Background layout mesh graph vector lines */}
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-20">
                        <div 
                          className="w-full h-full" 
                          style={{ 
                            backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)', 
                            backgroundSize: '15px 15px' 
                          }} 
                        />
                      </div>
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
