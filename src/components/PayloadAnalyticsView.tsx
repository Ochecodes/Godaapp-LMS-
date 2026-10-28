"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  CreditCard,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";

type AnalyticsResponse = {
  refreshedAt: string;
  sourceStatus: "ready" | "unavailable";
  analyticsError: string | null;
  metrics: {
    totalUsers: number;
    instructors: number;
    courses: number;
    activeEnrollments: number;
    paidUsers: number;
    freeUsers: number;
    referrals: number;
    affiliatePayouts: number;
    affiliatePayoutAmountUsd: number;
    paidReferralCommissionsUsd: number;
    pageViews: number | null;
    siteVisits: number | null;
    abandonedCheckouts: number | null;
    deletedAccounts: number | null;
    totalEarnedUsd: number | null;
    tinybirdPaidTransactions: number | null;
  };
  dailyActivity: {
    date: string;
    page_views: number;
    payments: number;
    revenue_usd: number;
  }[];
  courseActivity: {
    course_slug: string;
    checkout_starts: number;
    paid_transactions: number;
    abandoned_checkouts: number;
  }[];
};

type Metric = {
  label: string;
  value: number | null;
  icon: typeof Users;
  kind?: "currency";
  hint?: string;
};

export function PayloadAnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const result = (await response.json()) as AnalyticsResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Analytics could not be loaded.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const metrics: Metric[] = data
    ? [
        { label: "Total users", value: data.metrics.totalUsers, icon: Users },
        { label: "Site visits", value: data.metrics.siteVisits, icon: Activity },
        { label: "Page views", value: data.metrics.pageViews, icon: Activity },
        { label: "Paid users", value: data.metrics.paidUsers, icon: CreditCard },
        { label: "Free users", value: data.metrics.freeUsers, icon: Users },
        { label: "Active enrollments", value: data.metrics.activeEnrollments, icon: GraduationCap },
        { label: "Abandoned checkouts", value: data.metrics.abandonedCheckouts, icon: ArrowDownRight },
        { label: "Deleted accounts", value: data.metrics.deletedAccounts, icon: Users },
        { label: "Instructors", value: data.metrics.instructors, icon: Users },
        { label: "Courses", value: data.metrics.courses, icon: BookOpen },
        {
          label: "Gross course revenue",
          value: data.metrics.totalEarnedUsd,
          icon: ArrowUpRight,
          kind: "currency",
          hint: "Verified Paystack payments",
        },
        {
          label: "Affiliate payouts",
          value: data.metrics.affiliatePayoutAmountUsd,
          icon: Wallet,
          kind: "currency",
          hint: `${data.metrics.affiliatePayouts} settled payout requests`,
        },
        { label: "Referrals", value: data.metrics.referrals, icon: Users },
        {
          label: "Paid referral commissions",
          value: data.metrics.paidReferralCommissionsUsd,
          icon: Wallet,
          kind: "currency",
        },
      ]
    : [];

  return (
    <main className="goda-analytics">
      <header className="goda-analytics-header">
        <div>
          <p className="goda-analytics-eyebrow">GODAAPP · PLATFORM INSIGHTS</p>
          <h1>Platform analytics</h1>
          <p>Operational, enrollment, and revenue signals for the learning platform.</p>
        </div>
        <button
          className="goda-analytics-refresh"
          disabled={loading}
          onClick={() => void loadAnalytics()}
          type="button"
        >
          {loading ? <LoaderCircle aria-hidden="true" className="goda-analytics-spin" /> : <RefreshCw aria-hidden="true" />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="goda-analytics-alert" role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{error}</span>
          <button onClick={() => void loadAnalytics()} type="button">Try again</button>
        </div>
      )}

      {data?.analyticsError && (
        <div className="goda-analytics-alert goda-analytics-alert-warning" role="status">
          <CircleAlert aria-hidden="true" />
          <span>
            {data.analyticsError} Platform and Payload totals are available; traffic, revenue,
            checkout abandonment, and account-deletion tracking need the Tinybird data source.
          </span>
        </div>
      )}

      {loading && !data ? (
        <div className="goda-analytics-loading">
          <LoaderCircle aria-hidden="true" className="goda-analytics-spin" />
          Loading platform metrics…
        </div>
      ) : data ? (
        <>
          <section aria-label="Platform key metrics" className="goda-analytics-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <div className="goda-analytics-lower">
            <section aria-labelledby="traffic-chart-title" className="goda-analytics-panel">
              <div className="goda-analytics-panel-heading">
                <div>
                  <h2 id="traffic-chart-title">Traffic & transactions</h2>
                  <p>Daily page views and verified payments · last 14 days</p>
                </div>
                <span className={`goda-analytics-status ${data.sourceStatus}`}>
                  {data.sourceStatus === "ready" ? "Live data" : "Awaiting Tinybird"}
                </span>
              </div>
              <ActivityChart days={data.dailyActivity} />
            </section>

            <section aria-labelledby="course-table-title" className="goda-analytics-panel">
              <div className="goda-analytics-panel-heading">
                <div>
                  <h2 id="course-table-title">Course checkout funnel</h2>
                  <p>Starts that have not yet become verified purchases</p>
                </div>
              </div>
              {data.courseActivity.length ? (
                <div className="goda-analytics-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Course</th>
                        <th scope="col">Started</th>
                        <th scope="col">Paid</th>
                        <th scope="col">Abandoned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.courseActivity.map((course) => (
                        <tr key={course.course_slug}>
                          <th scope="row">{course.course_slug}</th>
                          <td>{formatNumber(course.checkout_starts)}</td>
                          <td>{formatNumber(course.paid_transactions)}</td>
                          <td>
                            <span className="goda-analytics-abandoned">
                              {formatNumber(course.abandoned_checkouts)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="goda-analytics-empty">
                  Checkout funnel data will appear after the Tinybird event source is deployed and
                  checkout activity has been recorded.
                </div>
              )}
            </section>
          </div>

          <p className="goda-analytics-footnote">
            {data.refreshedAt
              ? `Last refreshed ${new Date(data.refreshedAt).toLocaleString()}.`
              : ""}
            {" "}Paid/free learner counts use active enrollments and the course’s current Payload price.
            Affiliate payouts sum payout requests marked settled.
          </p>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  const value =
    metric.value === null
      ? "—"
      : metric.kind === "currency"
        ? formatCurrency(metric.value)
        : formatNumber(metric.value);

  return (
    <article className="goda-analytics-card">
      <span className="goda-analytics-icon"><Icon aria-hidden="true" /></span>
      <p>{metric.label}</p>
      <strong>{value}</strong>
      {metric.hint && <span className="goda-analytics-hint">{metric.hint}</span>}
    </article>
  );
}

function ActivityChart({ days }: { days: AnalyticsResponse["dailyActivity"] }) {
  if (!days.length) {
    return (
      <div className="goda-analytics-empty">
        Daily activity will appear as visits and verified payments are collected.
      </div>
    );
  }

  const max = Math.max(1, ...days.map((day) => Number(day.page_views)));
  const barWidth = Math.max(3, 660 / days.length - 8);

  return (
    <div className="goda-analytics-chart">
      <div className="goda-analytics-legend">
        <span><i className="page-view" /> Page views</span>
        <span><i className="payment" /> Payments</span>
      </div>
      <svg
        aria-label="Bar chart of daily page views and verified payments over fourteen days"
        className="goda-analytics-svg"
        role="img"
        viewBox="0 0 700 220"
      >
        {[0, 1, 2, 3].map((line) => {
          const y = 20 + line * 52;
          return <line key={line} x1="30" x2="690" y1={y} y2={y} />;
        })}
        {days.map((day, index) => {
          const groupWidth = 660 / days.length;
          const x = 32 + index * groupWidth;
          const pageHeight = (Number(day.page_views) / max) * 166;
          const paymentHeight = Math.max(0, Math.min(166, (Number(day.payments) / max) * 166));
          return (
            <g key={day.date}>
              <rect
                className="page-view-bar"
                height={pageHeight}
                rx="3"
                width={barWidth / 2}
                x={x}
                y={190 - pageHeight}
              >
                <title>{`${day.date}: ${formatNumber(Number(day.page_views))} page views`}</title>
              </rect>
              <rect
                className="payment-bar"
                height={paymentHeight}
                rx="3"
                width={barWidth / 2}
                x={x + barWidth / 2 + 2}
                y={190 - paymentHeight}
              >
                <title>{`${day.date}: ${formatNumber(Number(day.payments))} payments`}</title>
              </rect>
              {(index % Math.max(1, Math.ceil(days.length / 7)) === 0 || index === days.length - 1) && (
                <text x={x} y="211">{day.date.slice(5)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
