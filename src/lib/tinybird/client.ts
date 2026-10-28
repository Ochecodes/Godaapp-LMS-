export type TinybirdEventName =
  | "page_view"
  | "checkout_started"
  | "payment_succeeded"
  | "account_deleted";

export type TinybirdEvent = {
  event: TinybirdEventName;
  event_id?: string;
  visitor_id?: string;
  path?: string;
  referrer?: string;
  user_agent?: string;
  course_slug?: string;
  amount_usd?: number;
};

export type TinybirdAnalyticsSummary = {
  page_views: number;
  site_visits: number;
  checkout_starts: number;
  paid_transactions: number;
  gross_revenue_usd: number;
  deleted_accounts: number;
};

export type TinybirdDailyActivity = {
  date: string;
  page_views: number;
  payments: number;
  revenue_usd: number;
};

export type TinybirdCourseActivity = {
  course_slug: string;
  checkout_starts: number;
  paid_transactions: number;
  abandoned_checkouts: number;
};

type TinybirdJSONResponse<T> = {
  data?: T[];
  error?: string;
  message?: string;
};

const DEFAULT_DATASOURCE = "godaapp_events";

function getTinybirdConfig() {
  const token = process.env.TINYBIRD_API_KEY;
  const baseURL = process.env.TINYBIRD_URL;
  if (!token || !baseURL) return null;

  return {
    token,
    baseURL: baseURL.replace(/\/+$/, ""),
    datasource: process.env.TINYBIRD_ANALYTICS_DATASOURCE || DEFAULT_DATASOURCE,
  };
}

function getEventPayload(event: TinybirdEvent) {
  return {
    timestamp: new Date().toISOString(),
    event: event.event,
    event_id: event.event_id || globalThis.crypto.randomUUID(),
    visitor_id: event.visitor_id || "",
    path: event.path || "",
    referrer: event.referrer || "",
    user_agent: event.user_agent || "",
    course_slug: event.course_slug || "",
    amount_usd: Number.isFinite(event.amount_usd) ? event.amount_usd : 0,
  };
}

async function queryTinybird<T>(query: string): Promise<T[]> {
  const config = getTinybirdConfig();
  if (!config) throw new Error("Tinybird analytics is not configured.");

  const response = await fetch(`${config.baseURL}/v0/sql`, {
    method: "POST",
    headers: {
      Authorization: `******`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ q: query }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  const result = (await response.json()) as TinybirdJSONResponse<T>;
  if (!response.ok || !result.data) {
    throw new Error(result.error || result.message || `Tinybird query failed (${response.status}).`);
  }
  return result.data;
}

export function isTinybirdConfigured() {
  return getTinybirdConfig() !== null;
}

export async function trackTinybirdEvent(event: TinybirdEvent): Promise<void> {
  const config = getTinybirdConfig();
  if (!config) throw new Error("Tinybird analytics is not configured.");

  const response = await fetch(
    `${config.baseURL}/v0/events?name=${encodeURIComponent(config.datasource)}`,
    {
      method: "POST",
      headers: {
        Authorization: `******`,
        "Content-Type": "application/x-ndjson",
      },
      body: JSON.stringify(getEventPayload(event)),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Tinybird event ingestion failed (${response.status}): ${responseText.slice(0, 300)}`);
  }
}

export async function getTinybirdAnalytics() {
  const config = getTinybirdConfig();
  if (!config) throw new Error("Tinybird analytics is not configured.");
  const table = `\`${config.datasource.replace(/`/g, "")}\``;

  const [summaryRows, dailyViews, dailyPayments, courseActivity] = await Promise.all([
    queryTinybird<TinybirdAnalyticsSummary>(`
      SELECT
        countIf(event = 'page_view') AS page_views,
        uniqExactIf(visitor_id, event = 'page_view' AND visitor_id != '') AS site_visits,
        uniqExactIf(event_id, event = 'checkout_started') AS checkout_starts,
        (SELECT count() FROM (
          SELECT event_id
          FROM ${table}
          WHERE event = 'payment_succeeded'
          GROUP BY event_id
        )) AS paid_transactions,
        (SELECT sum(amount_usd) FROM (
          SELECT argMax(amount_usd, timestamp) AS amount_usd
          FROM ${table}
          WHERE event = 'payment_succeeded'
          GROUP BY event_id
        )) AS gross_revenue_usd,
        uniqExactIf(event_id, event = 'account_deleted') AS deleted_accounts
      FROM ${table}
      FORMAT JSON
    `),
    queryTinybird<TinybirdDailyActivity>(`
      SELECT
        toString(toDate(timestamp)) AS date,
        count() AS page_views,
        toUInt64(0) AS payments,
        toFloat64(0) AS revenue_usd
      FROM ${table}
      WHERE event = 'page_view'
        AND timestamp >= now() - INTERVAL 14 DAY
      GROUP BY toDate(timestamp)
      ORDER BY toDate(timestamp)
      FORMAT JSON
    `),
    queryTinybird<TinybirdDailyActivity>(`
      SELECT
        toString(toDate(timestamp)) AS date,
        toUInt64(0) AS page_views,
        count() AS payments,
        sum(amount_usd) AS revenue_usd
      FROM (
        SELECT
          event_id,
          argMax(timestamp, timestamp) AS timestamp,
          argMax(amount_usd, timestamp) AS amount_usd
        FROM ${table}
        WHERE event = 'payment_succeeded'
          AND timestamp >= now() - INTERVAL 14 DAY
        GROUP BY event_id
      )
      GROUP BY toDate(timestamp)
      ORDER BY toDate(timestamp)
      FORMAT JSON
    `),
    queryTinybird<TinybirdCourseActivity>(`
      SELECT
        course_slug,
        uniqExactIf(event_id, event = 'checkout_started') AS checkout_starts,
        uniqExactIf(event_id, event = 'payment_succeeded') AS paid_transactions,
        greatest(checkout_starts - paid_transactions, 0) AS abandoned_checkouts
      FROM ${table}
      WHERE course_slug != ''
        AND event IN ('checkout_started', 'payment_succeeded')
      GROUP BY course_slug
      ORDER BY abandoned_checkouts DESC, checkout_starts DESC
      LIMIT 10
      FORMAT JSON
    `),
  ]);

  const dailyByDate = new Map<string, TinybirdDailyActivity>();
  for (const day of dailyViews) dailyByDate.set(day.date, { ...day });
  for (const day of dailyPayments) {
    const current = dailyByDate.get(day.date) ?? {
      date: day.date,
      page_views: 0,
      payments: 0,
      revenue_usd: 0,
    };
    current.payments = Number(day.payments);
    current.revenue_usd = Number(day.revenue_usd);
    dailyByDate.set(day.date, current);
  }

  return {
    summary: summaryRows[0] ?? null,
    dailyActivity: [...dailyByDate.values()].sort((first, second) => first.date.localeCompare(second.date)),
    courseActivity,
  };
}