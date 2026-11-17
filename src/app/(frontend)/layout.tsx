import type { Metadata } from "next";
import Script from "next/script";
import { AuthLogoutSync } from "@/components/auth/AuthLogoutSync";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://godaapp.com"),
  title: {
    default: "GodaApp | Digital Asset Education",
    template: "%s | GodaApp",
  },
  description:
    "Practical, interactive education for digital asset markets, trading, and risk management.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GodaApp",
    url: "https://godaapp.com",
    title: "GodaApp | Digital Asset Education",
    description:
      "Practical, interactive education for digital asset markets, trading, and risk management.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "GodaApp digital asset education" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GodaApp | Digital Asset Education",
    description:
      "Practical, interactive education for digital asset markets, trading, and risk management.",
    images: ["/og-image.svg"],
  },
};

export default function FrontendRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <QueryProvider>
          {children}
          <AuthLogoutSync />
        </QueryProvider>
        <Script src="/gradualFade.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
