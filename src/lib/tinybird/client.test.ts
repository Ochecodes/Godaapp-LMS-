import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTinybirdAnalytics,
  isTinybirdConfigured,
  trackTinybirdEvent,
} from "@/lib/tinybird/client";

describe("Tinybird analytics client", () => {
  beforeEach(() => {
    vi.stubEnv("TINYBIRD_API_KEY", "tinybird-test-token");
    vi.stubEnv("TINYBIRD_URL", "https://api.tinybird.example/");
    vi.stubEnv("TINYBIRD_ANALYTICS_DATASOURCE", "");
    vi.stubGlobal("fetch", vi.fn());
  });

  it("reports configuration only when both key and URL exist", () => {
    expect(isTinybirdConfigured()).toBe(true);
    vi.stubEnv("TINYBIRD_API_KEY", "");
    expect(isTinybirdConfigured()).toBe(false);
    vi.stubEnv("TINYBIRD_API_KEY", "tinybird-test-token");
    vi.stubEnv("TINYBIRD_URL", "");
    expect(isTinybirdConfigured()).toBe(false);
  });

  it("sends a bounded event payload to the configured data source", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 202 }));

    await expect(
      trackTinybirdEvent({
        event: "payment_succeeded",
        event_id: "checkout_1",
        course_slug: "course-1",
        amount_usd: Number.NaN,
      }),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      "https://api.tinybird.example/v0/events?name=godaapp_events",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: expect.stringContaining('"amount_usd":0'),
      }),
    );
  });

  it("reports missing configuration and ingestion failures", async () => {
    vi.stubEnv("TINYBIRD_API_KEY", "");
    await expect(trackTinybirdEvent({ event: "page_view" })).rejects.toThrow(
      "not configured",
    );

    vi.stubEnv("TINYBIRD_API_KEY", "tinybird-test-token");
    vi.mocked(fetch).mockResolvedValue(new Response("bad datasource", { status: 403 }));
    await expect(trackTinybirdEvent({ event: "page_view" })).rejects.toThrow(
      "Tinybird event ingestion failed (403)",
    );
  });

  it("merges sorted daily analytics from concurrent read-only queries", async () => {
    vi.stubEnv("TINYBIRD_ANALYTICS_DATASOURCE", "events` FORMAT JSON --");
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      const query = new URLSearchParams(String(init?.body)).get("q") ?? "";
      if (query.includes("gross_revenue_usd")) {
        return Response.json({
          data: [{
            page_views: 12,
            site_visits: 5,
            checkout_starts: 3,
            paid_transactions: 1,
            gross_revenue_usd: 49.99,
            deleted_accounts: 0,
          }],
        });
      }
      if (query.includes("toUInt64(0) AS payments")) {
        return Response.json({
          data: [{ date: "2026-02-02", page_views: 9, payments: 0, revenue_usd: 0 }],
        });
      }
      if (query.includes("sum(amount_usd) AS revenue_usd")) {
        return Response.json({
          data: [{ date: "2026-02-01", page_views: 0, payments: 1, revenue_usd: 49.99 }],
        });
      }
      return Response.json({
        data: [{
          course_slug: "course-1",
          checkout_starts: 3,
          paid_transactions: 1,
          abandoned_checkouts: 2,
        }],
      });
    });

    const analytics = await getTinybirdAnalytics();

    expect(analytics.summary).toMatchObject({
      page_views: 12,
      paid_transactions: 1,
      gross_revenue_usd: 49.99,
    });
    expect(analytics.dailyActivity.map(({ date }) => date)).toEqual([
      "2026-02-01",
      "2026-02-02",
    ]);
    expect(analytics.dailyActivity[0]).toMatchObject({ payments: 1, revenue_usd: 49.99 });
    expect(analytics.dailyActivity[1]).toMatchObject({ page_views: 9, payments: 0 });
    expect(analytics.courseActivity[0].course_slug).toBe("course-1");

    const requests = vi.mocked(fetch).mock.calls;
    expect(requests).toHaveLength(4);
    expect(requests.every(([url]) => url === "https://api.tinybird.example/v0/sql")).toBe(true);
    expect(requests.every(([, options]) => options?.cache === "no-store")).toBe(true);
    expect(
      requests.every(([, options]) =>
        !String(options?.body).includes("events` FORMAT JSON --"),
      ),
    ).toBe(true);
  });
});
