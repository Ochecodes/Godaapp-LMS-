"use client";

import React from 'react';

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
    imageSrc: "/Asian.jpg" // Place this image in your public/ folder
  },
  {
    quote: "The analytics capabilities have given us unprecedented insights into my referrals. I've been able to make data-driven decisions that have directly impacted the number of potential students reached on social media. It's been a game-changer for my affiliate business.",
    name: "Sarah Jones",
    role: "Affiliate Marketer",
    imageSrc: "/American.jpg" // Place this image in your public/ folder
  },
  {
    quote: "This platform has revolutionized how I see the crypto space for good. The tailored learning saved me hours on youtube each week, and I love the transparency in the lessons. It's rare to find an app like Goda that benefits both seasoned investors and newbies.",
    name: "Ifiok Thompson",
    role: "Crypto Investor",
    imageSrc: "/Nigerian.jpg" // Place this image in your public/ folder
  }
];

export default function Testimonials() { 
  return (
    <section className="w-full bg-[#09090b] text-white py-24 md:py-32 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold sentences tracking-wider text-[#068365]">
            Trusted by customers
          </span>
          <h2 className="mt-3 text-4xl font-weight-bold/*300/* tracking-tight text-zinc-100 sm:text-5xl">
            What our customers say
          </h2>
        </div>

        {/* Responsive Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((item: TestimonialItemType, index: number) => (
            <div 
              key={index} 
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#09090b] p-8 shadow-2xl backdrop-blur-md hover:border-white/20 transition-all duration-300"
            >
              {/* Quote Content Block */}
              <div>
                <span className="text-3xl font-serif text-[#068365] block leading-none mb-2">
                  “
                </span>
                <p className="text-sm leading-relaxed text-zinc-400 font-normal">
                  {item.quote}
                </p>
              </div>

              {/* User Bio Footer Block */}
              <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                <img
                  src={item.imageSrc}
                  alt={item.name}
                  className="h-12 w-12 rounded-xl object-cover border border-white/10 bg-zinc-800"
                  loading="lazy"
                />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {item.role}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
