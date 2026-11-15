import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));
vi.mock("@/components/DashboardPageBanner", () => ({
  DashboardPageBanner: ({ title }: { title: string }) => <header>{title}</header>,
}));
vi.mock("@/components/DashboardContactForm", () => ({
  DashboardContactForm: () => null,
}));

import { StudentCommunityPage } from "@/components/StudentDashboardPages";

describe("StudentCommunityPage", () => {
  it("shows all six social channels as icon-only links in a two-column, three-row grid", () => {
    render(<StudentCommunityPage />);

    const list = screen.getByRole("list", { name: "GodaApp social media links" });
    const links = within(list).getAllByRole("link");

    expect(list).toHaveClass("grid-cols-2", "grid-rows-3");
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "GodaApp on Facebook",
      "GodaApp on Instagram",
      "GodaApp on LinkedIn",
      "GodaApp on X",
      "GodaApp on YouTube",
      "GodaApp on WhatsApp",
    ]);

    for (const link of links) {
      expect(link).toHaveClass("rounded-full");
      expect(link).toHaveTextContent(/^$/);
      expect(link.querySelectorAll("svg")).toHaveLength(1);
    }

    expect(screen.getByRole("link", { name: "GodaApp on WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/2348145356898?text=Hello%20GodaApp%20Support",
    );
  });
});
