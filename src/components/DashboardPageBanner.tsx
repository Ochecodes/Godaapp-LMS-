"use client";

import { DashboardIcon } from "@/components/DashboardIcon";
import { useDashboardIdentity } from "@/components/DashboardIdentity";

type DashboardPageBannerProps = {
  title: string;
  description: string;
  icon: string;
};

export function DashboardPageBanner({ title, description, icon }: DashboardPageBannerProps) {
  const { fullName, avatarUrl } = useDashboardIdentity();
  const firstName = fullName.trim().split(/\s+/)[0] || "Student";

  return (
    <header className="relative isolate mb-8 flex min-h-44 flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-[#073b31] px-6 py-6 text-white shadow-sm sm:flex-row sm:items-center sm:px-8 sm:py-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-12 -top-32 size-72 rounded-full bg-[#068365]/40 blur-3xl" />
        <div className="absolute -bottom-36 right-1/3 size-64 rounded-full bg-[#F57C00]/15 blur-3xl" />
      </div>
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-[#f5b066]">
          <DashboardIcon aria-hidden="true" className="size-6" icon={icon} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
            {title === "Overview" ? `Welcome back, ${firstName}` : "Student dashboard"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{description}</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3 self-start sm:self-center">
        {avatarUrl ? (
          <img alt="" className="size-16 rounded-full object-cover" src={avatarUrl} />
        ) : (
          <span aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-[#068365] text-2xl font-semibold">
            {firstName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-40 truncate text-sm font-semibold">{fullName}</span>
      </div>
    </header>
  );
}
