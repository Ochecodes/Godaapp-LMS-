import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ prefetch: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { DashboardShell } from "@/components/DashboardShell";

describe("DashboardShell theme switch", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("switches from a dark system theme to light on the first click", async () => {
    render(
      <DashboardShell
        createdAt=""
        email="learner@example.com"
        emailVerified
        fullName="Learner"
        profileMetadata={{}}
      >
        <p>Dashboard content</p>
      </DashboardShell>,
    );

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    fireEvent.click(screen.getByRole("button", { name: "Theme: system theme. Click to change." }));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("godaapp-dashboard-theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Theme: light theme. Click to change." })).toBeInTheDocument();
  });
});
