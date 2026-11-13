import type { MetadataRoute } from "next";

const publicPages: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/catalog", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/affiliate", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
];

function getSiteUrl(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://godaapp.com");

  try {
    const url = new URL(configuredUrl);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const isLocalHost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".example") ||
      hostname === "::1" ||
      hostname === "0.0.0.0";
    const ipv4 = hostname.split(".").map(Number);
    const isPrivateIpv4 =
      ipv4.length === 4 &&
      ipv4.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
      (ipv4[0] === 0 ||
        ipv4[0] === 10 ||
        ipv4[0] === 127 ||
        (ipv4[0] === 169 && ipv4[1] === 254) ||
        (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
        (ipv4[0] === 192 && ipv4[1] === 168));
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      isLocalHost ||
      isPrivateIpv4
    ) {
      throw new Error("Sitemap site URL must be a public HTTPS URL.");
    }
    return url;
  } catch (error) {
    throw new Error("Configure APP_BASE_URL or NEXT_PUBLIC_SITE_URL with a public HTTPS URL for the sitemap.", {
      cause: error,
    });
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return publicPages.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  }));
}
