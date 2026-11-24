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
  it("shows the social channels as icon-only links in a responsive grid", () => {
    render(<StudentCommunityPage />);

    const list = screen.getByRole("list", { name: "Godaapp social media links" });
    const links = within(list).getAllByRole("link");

    expect(list).toHaveClass("grid-cols-2");
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "Godaapp on Facebook",
      "Godaapp on Instagram",
      "Godaapp on LinkedIn",
      "Godaapp on X",
      "Godaapp on TikTok",
      "Godaapp on YouTube",
      "Godaapp on WhatsApp",
    ]);

    for (const link of links) {
      expect(link).toHaveClass("rounded-full");
      expect(link).toHaveTextContent(/^$/);
      expect(link.querySelectorAll("svg")).toHaveLength(1);
    }

    expect(screen.getByRole("link", { name: "Godaapp on WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/2348145356889?text=Hello%20Godaapp%20Support",
    );
  });
});
