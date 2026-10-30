"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";

export type DashboardUpcomingClass = {
  id: string;
  title: string;
  courseTitle: string;
  instructorName: string;
  startsAt: string;
};

type StudentDashboardOverviewProps = {
  courseCount: number;
  inProgressCount: number;
  completedCount: number;
  lessonCount: number;
  availableLessonCount: number;
  weeklyActivity: { day: string; label: string; seconds: number }[];
  activityGrid: { day: string; seconds: number }[];
  upcomingClasses: DashboardUpcomingClass[];
};

type MarketSnapshot = {
  bitcoin: { usd: number; usd_24h_change: number };
  ethereum: { usd: number; usd_24h_change: number };
  rates: { EUR: number; GBP: number };
  updatedAt: string;
};

const QUICK_ACTIONS = [
  { href: "/dashboard/settings", title: "Complete your profile", icon: "lucide:user-round-cog" },
  { href: "/dashboard/live", title: "View live classes", icon: "lucide:calendar-days" },
  { href: "/dashboard/resources", title: "Browse resources", icon: "lucide:files" },
  { href: "/dashboard/settings", title: "Change theme", icon: "lucide:palette" },
];

export function StudentDashboardOverview({
  courseCount,
  inProgressCount,
  completedCount,
  lessonCount,
  availableLessonCount,
  weeklyActivity,
  activityGrid,
  upcomingClasses,
}: StudentDashboardOverviewProps) {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [marketError, setMarketError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadMarket() {
      try {
        const [cryptoResponse, forexResponse] = await Promise.all([
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true", { signal: controller.signal }),
          fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal }),
        ]);
        if (!cryptoResponse.ok || !forexResponse.ok) {
          throw new Error("Market data is temporarily unavailable.");
        }
        const cryptoData: unknown = await cryptoResponse.json();
        const forexData: unknown = await forexResponse.json();
        if (!isCryptoResponse(cryptoData) || !isForexResponse(forexData)) {
          throw new Error("Market data returned an unexpected response.");
        }
        setMarket({
          bitcoin: cryptoData.bitcoin,
          ethereum: cryptoData.ethereum,
          rates: { EUR: forexData.rates.EUR, GBP: forexData.rates.GBP },
          updatedAt: forexData.time_last_update_utc,
        });
        setMarketError("");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMarketError(error instanceof Error ? error.message : "Market data could not be loaded.");
      }
    }

    void loadMarket();
    return () => controller.abort();
  }, []);

  const calendar = useMemo(() => makeCalendar(upcomingClasses), [upcomingClasses]);
  const maxDailySeconds = Math.max(1, ...weeklyActivity.map((item) => item.seconds));
  const maxGridSeconds = Math.max(0, ...activityGrid.map((item) => item.seconds));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="Your learning at a glance. Pick up where you left off and see what’s coming up."
        icon="lucide:layout-dashboard"
        title="Overview"
      />

      <section aria-label="Learning overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total courses" value={courseCount} detail="Active enrollments" icon="lucide:book-open-check" />
        <StatCard title="In progress" value={inProgressCount} detail="Courses with active learning" icon="lucide:circle-play" />
        <StatCard title="Completed" value={completedCount} detail="Courses finished" icon="lucide:circle-check" />
        <StatCard title="Lessons taken" value={lessonCount} detail={`${availableLessonCount} lessons available`} icon="lucide:library-big" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Upcoming live classes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your next instructor-led sessions.</p>
            </div>
            <Link className="text-sm font-semibold text-primary hover:underline" href="/dashboard/live">View all</Link>
          </div>
          {upcomingClasses.length ? (
            <ul className="mt-5 divide-y divide-border">
              {upcomingClasses.slice(0, 3).map((liveClass) => (
                <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={liveClass.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{liveClass.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{liveClass.courseTitle} · {liveClass.instructorName}</p>
                  </div>
                  <time className="text-sm font-medium text-foreground" dateTime={liveClass.startsAt}>
                    {formatDateTime(liveClass.startsAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage icon="lucide:calendar-clock" message="Scheduled classes for your courses will appear here." />
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Weekly learning activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Time spent learning, by day.</p>
          <div aria-label="Weekly learning time, measured in minutes" className="mt-6 grid h-36 grid-cols-7 items-end gap-2 border-b border-border">
            {weeklyActivity.map(({ day, label, seconds }) => (
              <div className="flex h-full min-w-0 flex-col items-center justify-end gap-2" key={day} title={`${label}: ${formatDuration(seconds)}`}>
                <span className="text-[10px] text-muted-foreground">{seconds ? formatDuration(seconds) : ""}</span>
                <div
                  className="min-h-1 w-full rounded-t-md bg-[#068365] transition-[height]"
                  style={{ height: `${seconds ? Math.max(8, (seconds / maxDailySeconds) * 70) : 4}%` }}
                />
                <span className="pb-2 text-[11px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {weeklyActivity.some((item) => item.seconds > 0)
              ? "Time is recorded while a lesson video is playing."
              : "Start a lesson to see your learning time here."}
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Class calendar</h2>
          <p className="mt-1 text-sm text-muted-foreground">{calendar.label}</p>
          <div className="mt-5 grid grid-cols-7 gap-y-2 text-center">
            {calendar.weekdays.map((day) => <span className="text-[11px] font-medium text-muted-foreground" key={day}>{day}</span>)}
            {calendar.days.map(({ date, inMonth, hasClass }, index) => (
              <span
                aria-label={date ? `${date.toDateString()}${hasClass ? ", live class scheduled" : ""}` : undefined}
                className={`relative mx-auto grid size-8 place-items-center rounded-full text-xs ${inMonth ? "text-foreground" : "text-muted-foreground/40"} ${hasClass ? "bg-[#068365]/10 font-semibold text-[#056d53]" : ""}`}
                key={date?.toISOString() ?? `empty-${index}`}
              >
                {date?.getDate()}
                {hasClass && <span aria-hidden="true" className="absolute bottom-0.5 size-1 rounded-full bg-[#F57C00]" />}
              </span>
            ))}
          </div>
          {upcomingClasses.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground"><span className="mr-1 inline-block size-1.5 rounded-full bg-[#F57C00]" />Scheduled class day</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Shortcuts to common tasks.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition hover:border-[#068365]/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={action.href} key={action.title}>
                <DashboardIcon aria-hidden="true" className="size-4 text-[#068365]" icon={action.icon} />
                {action.title}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Markets at a glance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Live public market data.</p>
          {market ? (
            <div className="mt-4 divide-y divide-border">
              <MarketRow label="Bitcoin" symbol="BTC" value={formatCurrency(market.bitcoin.usd)} change={market.bitcoin.usd_24h_change} />
              <MarketRow label="Ethereum" symbol="ETH" value={formatCurrency(market.ethereum.usd)} change={market.ethereum.usd_24h_change} />
              <MarketRow label="EUR / USD" symbol="FX" value={formatCurrency(1 / market.rates.EUR)} />
              <MarketRow label="GBP / USD" symbol="FX" value={formatCurrency(1 / market.rates.GBP)} />
              <p className="pt-3 text-[11px] text-muted-foreground">Updated {new Date(market.updatedAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className={`mt-5 rounded-lg px-3 py-2 text-sm ${marketError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`} role={marketError ? "alert" : "status"}>
              {marketError || "Loading current prices…"}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Market information is for education only and is not investment advice.</p>
        </section>
      </div>

      <section aria-labelledby="learning-history-title" className="mt-6 w-full rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold" id="learning-history-title">Learning history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your daily lesson activity over the last 12 weeks.</p>
          </div>
          <div aria-label="Activity intensity scale" className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3].map((level) => (
              <span aria-hidden="true" className={`size-3 rounded-sm ${getActivityColor(level)}`} key={level} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <div aria-label="Daily learning activity calendar" className="grid min-w-[720px] w-full auto-cols-fr grid-flow-col grid-rows-7 gap-1">
            {activityGrid.map(({ day, seconds }) => (
              <span
                aria-label={`${new Date(`${day}T00:00:00Z`).toLocaleDateString()}: ${formatDuration(seconds)} of learning`}
                className={`aspect-square w-full rounded-sm ${getActivityColor(getActivityLevel(seconds, maxGridSeconds))}`}
                key={day}
                title={`${day}: ${formatDuration(seconds)}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {activityGrid.some((item) => item.seconds > 0)
            ? "Only active video playback is included."
            : "Your activity will appear here as you watch lessons."}
        </p>
      </section>
    </main>
  );
}

function StatCard({ title, value, detail, icon }: { title: string; value: string | number; detail: string; icon: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-[#068365]/10 text-[#068365]">
          <DashboardIcon aria-hidden="true" className="size-4" icon={icon} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function EmptyMessage({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="mt-5 flex min-h-28 items-center gap-3 rounded-xl bg-muted/50 px-4 py-5">
      <DashboardIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" icon={icon} />
      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}

function MarketRow({ label, symbol, value, change }: { label: string; symbol: string; value: string; change?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{symbol}</span>
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <span className="text-right">
        <span className="block text-sm font-semibold">{value}</span>
        {change !== undefined && <span className={`mt-0.5 block text-[11px] ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span>}
      </span>
    </div>
  );
}

function isCryptoResponse(value: unknown): value is Pick<MarketSnapshot, "bitcoin" | "ethereum"> {
  if (!value || typeof value !== "object") return false;
  const crypto = value as Record<string, unknown>;
  return isPrice(crypto.bitcoin) && isPrice(crypto.ethereum);
}

function isPrice(value: unknown): value is { usd: number; usd_24h_change: number } {
  if (!value || typeof value !== "object") return false;
  const price = value as Record<string, unknown>;
  return typeof price.usd === "number" && typeof price.usd_24h_change === "number";
}

function isForexResponse(value: unknown): value is { rates: { EUR: number; GBP: number }; time_last_update_utc: string } {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.rates !== "object" || data.rates === null) return false;
  const rates = data.rates as Record<string, unknown>;
  return typeof rates.EUR === "number" && typeof rates.GBP === "number" && typeof data.time_last_update_utc === "string";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 4 : 0 }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function getActivityLevel(seconds: number, maximum: number) {
  if (seconds <= 0 || maximum <= 0) return 0;
  return Math.min(3, Math.ceil((seconds / maximum) * 3));
}

function getActivityColor(level: number) {
  return [
    "bg-muted",
    "bg-[#068365]/30",
    "bg-[#068365]/60",
    "bg-[#068365]",
  ][level];
}

function makeCalendar(classes: DashboardUpcomingClass[]) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const classDates = new Set(classes.map((item) => new Date(item.startsAt).toDateString()));
  const days: { date?: Date; inMonth: boolean; hasClass: boolean }[] = Array.from({ length: firstDay.getDay() }, () => ({ inMonth: false, hasClass: false }));
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    days.push({ date, inMonth: true, hasClass: classDates.has(date.toDateString()) });
  }
  while (days.length % 7 !== 0) days.push({ inMonth: false, hasClass: false });
  return {
    label: new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(today),
    weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    days,
  };
}
