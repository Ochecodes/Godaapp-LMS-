"use client";

import React from 'react';
import Link from 'next/link';

interface GridItemType {
  tag: string;
  title: string;
  desc: string;
  badge: string;
  innerImageSrc: string;
  price: string;
}

const GRID_ITEMS: GridItemType[] = [
  {
    tag: "Goda",
    title: "Capital Preservation & Survival Mindset",
    desc: "In trading, survival comes before profitability. A trader who protects capital can continue learning, improving, and compounding over time. Learn how",
    badge: "Free",
    innerImageSrc: "/Capital.jpg",
    price: "$0"
  },
  {
    tag: "Goda",
    title: "Forex Trading: Beginners Fundamentals",
    desc: "Forex trading rewards structure, not guesswork, and this course is built to give you that structure from the ground up.",
    badge: "Free",
    innerImageSrc: "/Forex.jpg",
    price: "$0"
  },
  {
    tag: "Goda",
    title: "Risk Management & Trading Psychology",
    desc: "Most traders dont fail because of strategy, they fail because of emotions & poor risk control. This course addresses the difference between survival and consistency.",
    badge: "Paid",
    innerImageSrc: "/Risk.jpg",
    price: "$49"
  },
  {
    tag: "Goda",
    title: "Cryptocurrency Market & Trading Fundamentals",
    desc: "Cryptocurrency trading isnt just about buying and selling,its about understanding how the market truly works. This course gives you that foundation.",
    badge: "Paid",
    innerImageSrc: "/Crypto.jpg",
    price: "$99"
  }
];

export default function FeaturedCourses() {
  return (
    <div className="relative w-full overflow-hidden bg-transparent text-zinc-950 min-h-150 border-t border-zinc-200/50">
      
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
      <div className="relative z-20 mx-auto max-w-7xl px-6 py-24 md:py-32">
        
        {/* Relative wrapper holding the grid to safely anchor the absolute side tab */}
        <div className="relative w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full justify-center">
            {GRID_ITEMS.map((item: GridItemType, index: number) => (
              <div key={index} className="w-full group">
                
                <div className="relative border border-zinc-200/80 overflow-hidden bg-white rounded-2xl flex flex-col hover:border-zinc-300 transition-all duration-300 shadow-xl shadow-zinc-900/[0.03]">
                  
                  {/* Course Card Preview Screenshot Area */}
                  <div className="p-4 flex justify-center relative">
                    <div className="w-full h-56 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden relative">
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
                  <div className="p-6">
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
                      <div className="flex items-center gap-4">
                        <Link href="#" className="text-white bg-[#F57C00] hover:bg-[#E65100] transition flex items-center text-xs font-semibold px-4 py-2 rounded-lg shadow-sm duration-200 tracking-wide uppercase">
                          Enroll
                          <svg className="w-3 h-3 ml-1.5" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
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

                </div>
              </div>
            ))}
          </div>

          {/* 
            ========================================================================
            💡 REPLICATED GREEN VERTICAL SIDE BUTTON (EXPLORE COURSES)
            Pushed wide outside the card edges with translate-x-16 for maximum breathing room
            ========================================================================
          */}
          <div className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-24 z-30">
  <Link 
    href="#catalog"
    className="flex items-center justify-center bg-[#068365] hover:bg-[#056d53] text-zinc-100 hover:text-white font-bold text-xs rounded-xl px-5 py-4 shadow-md shadow-zinc-900/[0.04] transition-all duration-200 border border-white/10 tracking-wider shadow-lg"
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
