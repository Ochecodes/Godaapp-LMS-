import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Godaapp - Digital Asset Education Content Network",
  description: "Highly targeted, interactive content delivery network for global learners.",
};

export default function FrontendRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
