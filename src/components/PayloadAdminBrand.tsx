"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@payloadcms/ui";

export function PayloadGraphic() {
  return (
    <span className="goda-admin-graphic">
      <img src="/logotrans.png" alt="GodaApp" />
    </span>
  );
}

export function PayloadNavBrand() {
  return (
    <a className="goda-admin-nav-brand" href="/instructor-panel" aria-label="GodaApp dashboard">
      <span className="goda-admin-logo-frame">
        <img src="/logotrans.png" alt="GodaApp" />
      </span>
      <span>GodaApp workspace</span>
    </a>
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
      <a className="goda-admin-analytics-link" href="/instructor-panel/analytics">
        Open platform analytics
      </a>
    </section>
  );
}
