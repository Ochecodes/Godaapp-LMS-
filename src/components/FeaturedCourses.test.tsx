import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CatalogStoreProvider } from "@/lib/catalog-store";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    <span role="img" aria-label={alt} />
  ),
}));

import FeaturedCourses from "@/components/ui/featured-courses";

describe("FeaturedCourses query cache", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shares the cached public course-details request between catalog components", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        "cryptocurrency-market-and-trading-fundamentals": {
          priceUSD: 0,
          originalPriceUSD: null,
          lessons: [{ id: 11, title: "Market structure", isPreview: true }],
        },
      }),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })}
      >
        <CatalogStoreProvider>
          <FeaturedCourses compact />
          <FeaturedCourses compact />
        </CatalogStoreProvider>
      </QueryClientProvider>,
    );

    const exploreButtons = await screen.findAllByRole("button", { name: "Explore lessons" });
    const user = userEvent.setup();
    await user.click(exploreButtons[0]);
    expect(await screen.findByText("Market structure")).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/catalog/featured-courses");
  });

  it("shows a recoverable status when the public catalog request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "Unavailable" }, { status: 503 }),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })}
      >
        <CatalogStoreProvider>
          <FeaturedCourses compact />
        </CatalogStoreProvider>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Live course prices and lesson previews could not be loaded."),
    ).toBeInTheDocument();
  });
});
