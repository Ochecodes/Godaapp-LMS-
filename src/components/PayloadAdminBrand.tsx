"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@payloadcms/ui";

export function PayloadGraphic() {
  return (
    <span className="goda-admin-graphic">
      <Image src="/logotrans.avif" alt="GodaApp" width={42} height={32} />
    </span>
  );
}

export function PayloadNavBrand() {
  return (
    <Link className="goda-admin-nav-brand" href="/instructor-panel" aria-label="GodaApp dashboard">
      <span className="goda-admin-logo-frame">
        <Image src="/logotrans.avif" alt="GodaApp" width={82} height={58} />
      </span>
      <span>GodaApp workspace</span>
    </Link>
  );
}

export function PayloadThemeToggle() {
  const { setTheme, theme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      className="goda-admin-theme-toggle"
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
    >
      {nextTheme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
}

export function PayloadDashboardWelcome() {
  return (
    <section className="goda-admin-welcome" aria-labelledby="goda-admin-welcome-title">
      <p>GODAAPP · LEARNING PLATFORM</p>
      <h1 id="goda-admin-welcome-title">Your GodaApp workspace</h1>
      <span>Manage courses, learning content, and program requests in one place.</span>
      <Link className="goda-admin-analytics-link" href="/instructor-panel/analytics">
        Open platform analytics
      </Link>
    </section>
  );
}
