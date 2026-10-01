"use client";

import React from 'react';
import Link from 'next/link';

interface FaqItemType {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItemType[] = [
  {
    question: "Why doesnt Global Digital Assets Academy issue certificates?",
    answer: "Financial markets do not reward certificates, they reward competence, discipline, and execution. Our focus is on developing practical market understanding and real-world capability rather than symbolic credentials."
  },
  {
    question: "How will I know I have completed a course?",
    answer: "Your learning dashboard will reflect your progress and indicate when a course has been completed. Course completion is tracked internally for your personal learning journey and progression within the academy."
  },
  {
    question: "Does completing a course qualify me to trade professionally?",
    answer: "No. Completing a course provides educational knowledge and strategic frameworks, but professional market competence is developed through continued study, disciplined practice, and real-world experience."
  },
  {
    question: "Are your courses accredited by any institution or regulator?",
    answer: "No. Global Digital Assets Academy is an independent educational platform and does not provide accredited academic, regulatory, or professional licensing qualifications."
  },
  {
    question: "What is the primary goal of the Academys education programs?",
    answer: "Our goal is to develop informed, disciplined, and strategically minded market participants by teaching practical frameworks for understanding and engaging with financial markets responsibly."
  },
  {
    question: "How should I apply what I learn after completing a course?",
    answer: "Students are encouraged to apply course principles gradually and responsibly through structured observation, practice, strategy development, and disciplined execution before increasing real market exposure."
  }
];

interface FaqSectionProps {
  contactHeader?: boolean;
}

export default function FaqSection({ contactHeader = false }: FaqSectionProps) {
  return (
    // 💡 Styled with your exact warm cream backdrop color matching FeaturedCourses
    <div className="relative w-full overflow-hidden bg-[#FFFFFF] text-zinc-950 border-t border-zinc-200/50">
      
      {/* 💡 Identical High-Performance Inline SVG Grain Effect for identical texturing */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.035] select-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://w3.org id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 💡 Grid container maximized to 7xl to match page layout edges perfectly */}
      {/* Updated code: tightly snaps the top margin while keeping a healthy bottom cushion */}
<div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 pb-20 md:pt-8 md:pb-24">

        
        {/* Section Header */}
        <div className={`mb-10 max-w-3xl text-left md:mb-12 ${contactHeader ? "" : "mb-20 md:mb-20"}`}>
          {!contactHeader && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[#068365]">
              Support
            </span>
          )}
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {contactHeader ? (
              <>
                Got more Questions?
                <Link
                  href="/contact"
                  className="ml-2 inline-block align-baseline px-0.5 text-base font-semibold leading-tight text-[#068365] underline decoration-2 underline-offset-2 transition-colors hover:text-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#068365] focus-visible:ring-offset-2 sm:text-lg"
                >
                  Contact Us
                </Link>
              </>
            ) : (
              "Got Questions? We've Got Answers!"
            )}
          </h2>
          {!contactHeader && (
            <p className="mt-4 text-sm text-zinc-600 font-normal leading-relaxed">
              We've gathered all the answers you're looking for, neatly organized just for you.
            </p>
          )}
        </div>

        {/* 2-Column QA Layout matching the structural output of the provided image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {FAQ_DATA.map((item: FaqItemType, index: number) => (
            <div key={index} className="flex flex-col gap-2.5">
              {/* Question */}
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                {item.question}
              </h3>
              {/* Answer */}
              <p className="text-xs leading-relaxed text-zinc-600 font-normal">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
