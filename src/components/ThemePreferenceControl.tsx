"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

export function ThemePreferenceControl() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem("godaapp-dashboard-theme");
    const initialMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setMode(initialMode);
    applyTheme(initialMode);
  }, []);

  function chooseTheme(nextMode: ThemeMode) {
    setMode(nextMode);
    localStorage.setItem("godaapp-dashboard-theme", nextMode);
    applyTheme(nextMode);
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-7">
      <h2 className="font-semibold">Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose light, dark, or follow your device setting.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["light", "dark", "system"] as const).map((theme) => (
          <button
            aria-pressed={mode === theme}
            className={`rounded-lg border px-4 py-2 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              mode === theme ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
            }`}
            key={theme}
            onClick={() => chooseTheme(theme)}
            type="button"
          >
            {theme === "system" ? "Automatic" : theme}
          </button>
        ))}
      </div>
    </section>
  );
}

function applyTheme(mode: ThemeMode) {
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
