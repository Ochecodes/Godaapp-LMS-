"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "top" | "left" | "right" | "bottom" | "bounce";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  duration?: number;
  id?: string;
}

const offsets: Record<Exclude<RevealDirection, "bounce">, { x: number; y: number }> = {
  top: { x: 0, y: -18 },
  left: { x: -18, y: 0 },
  right: { x: 18, y: 0 },
  bottom: { x: 0, y: 18 },
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "bottom",
  duration = 300,
  id,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isRevealReady, setIsRevealReady] = useState(false);
  const offset = direction === "bounce" ? { x: 0, y: 12 } : offsets[direction];

  useEffect(() => {
    const element = ref.current;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (
      !element ||
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    setIsVisible(false);
    setIsRevealReady(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("scroll-reveal", direction === "bounce" && "scroll-reveal--bounce", className)}
      data-reveal-ready={isRevealReady}
      data-reveal-visible={isVisible}
      id={id}
      style={
        {
          "--reveal-x": `${offset.x}px`,
          "--reveal-y": `${offset.y}px`,
          "--reveal-delay": `${delay}s`,
          "--reveal-duration": `${duration}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
