import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AffiliatePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AffiliateMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "green" | "orange" | "blue" | "neutral";
}) {
  const toneClass = {
    green: "bg-primary/10",
    orange: "bg-orange-500/10",
    blue: "bg-sky-500/10",
    neutral: "bg-muted",
  }[tone];

  return (
    <article className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg text-zinc-950 dark:text-white ${toneClass}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

export function AffiliateStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/[- ]/g, "_");
  const className =
    normalized === "approved" ||
    normalized === "paid" ||
    normalized === "paid_offline" ||
    normalized === "available" ||
    normalized === "released" ||
    normalized === "verified" ||
    normalized === "resolved"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : normalized === "rejected" || normalized === "reversed" || normalized === "closed"
        ? "border-destructive/20 bg-destructive/10 text-destructive"
        : normalized === "submitted" ||
          normalized === "under_review" ||
          normalized === "pending" ||
          normalized === "in_review" ||
          normalized === "reserved" ||
          normalized === "needs_information"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-border bg-muted text-muted-foreground";
  const label = status.replace(/_/g, " ");

  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${className}`}>
      {label}
    </span>
  );
}

export function AffiliateEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
      <div className="max-w-md">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function formatAffiliateCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatAffiliateDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}
