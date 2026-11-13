import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists the public information architecture using the configured canonical origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://learn.godaapp.com");

    const pages = sitemap();

    expect(pages.map(({ url }) => url)).toEqual([
      "https://learn.godaapp.com/",
      "https://learn.godaapp.com/catalog",
      "https://learn.godaapp.com/about",
      "https://learn.godaapp.com/affiliate",
      "https://learn.godaapp.com/contact",
      "https://learn.godaapp.com/faq",
      "https://learn.godaapp.com/privacy-policy",
      "https://learn.godaapp.com/terms-of-service",
    ]);
    expect(pages.find(({ url }) => url.endsWith("/catalog"))).toMatchObject({
      changeFrequency: "weekly",
      priority: 0.9,
    });
  });

  it("does not include authenticated, API, payment, or CMS routes", () => {
    const urls = sitemap().map(({ url }) => url);

    expect(urls.some((url) => /dashboard|sign-in|sign-up|api|checkout|instructor-panel/.test(url))).toBe(
      false,
    );
  });

  it("rejects a non-HTTPS canonical URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

    expect(() => sitemap()).toThrow("public HTTPS URL");
  });

  it("rejects a private network URL even if it uses HTTPS", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://192.168.1.20");

    expect(() => sitemap()).toThrow("public HTTPS URL");
  });
});
