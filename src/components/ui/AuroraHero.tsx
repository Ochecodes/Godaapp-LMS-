import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraHeroProps {
  children: ReactNode;
  className?: string;
}

/**
 * Injects the CSS keyframes for the aurora animation.
 */
const AuroraAnimation = () => (
  <style>
    {`
      @keyframes aurora-1 {
        0% { transform: translate(0%, 0%) scale(1); }
        25% { transform: translate(20%, -20%) scale(1.2); }
        50% { transform: translate(-20%, 20%) scale(0.8); }
        75% { transform: translate(10%, -10%) scale(1.1); }
        100% { transform: translate(0%, 0%) scale(1); }
      }
      @keyframes aurora-2 {
        0% { transform: translate(0%, 0%) scale(1); }
        25% { transform: translate(-20%, 20%) scale(1.1); }
        50% { transform: translate(20%, -20%) scale(0.9); }
        75% { transform: translate(-10%, 10%) scale(1.2); }
        100% { transform: translate(0%, 0%) scale(1); }
      }
    `}
  </style>
);

export const AuroraHero = ({ children, className }: AuroraHeroProps) => {
  return (
    <div className="w-full">
      <AuroraAnimation />
      <div
        className={cn(
          "dark relative flex w-full flex-col items-center justify-start overflow-hidden bg-zinc-950 px-6 pt-20 pb-16 text-white antialiased",
          className
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-20 -top-24 size-[min(70vw,38rem)] rounded-full bg-zinc-100/50 opacity-90 blur-[100px]"
            style={{ animation: "aurora-1 20s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-32 -right-20 size-[min(70vw,38rem)] rounded-full bg-zinc-300/40 opacity-90 blur-[110px]"
            style={{ animation: "aurora-2 24s ease-in-out infinite" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-300/10 via-zinc-900/45 to-zinc-950/90" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
      </div>
    </div>
  );
};