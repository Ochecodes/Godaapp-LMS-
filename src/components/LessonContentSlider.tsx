"use client";

import { Children, type ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LessonContentSlider({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!slides.length) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <p aria-live="polite" className="text-xs font-medium text-muted-foreground">
          Section {activeIndex + 1} of {slides.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous lesson content section"
            className="h-9 gap-1.5 px-3"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((index) => index - 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </Button>
          <Button
            aria-label="Next lesson content section"
            className="h-9 gap-1.5 px-3"
            disabled={activeIndex === slides.length - 1}
            onClick={() => setActiveIndex((index) => index + 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <div
        aria-label={`Scrollable lesson content section ${activeIndex + 1} of ${slides.length}`}
        className="max-h-[28rem] min-h-48 overflow-y-auto border-t border-border px-5 py-5 text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:list-disc"
        key={activeIndex}
        role="region"
        tabIndex={0}
      >
        {slides[activeIndex]}
      </div>
    </div>
  );
}
