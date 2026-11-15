import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/affiliate-dashboard/links",
}));
vi.mock("@/app/(frontend)/(affiliate-portal)/affiliate-dashboard/actions", () => ({
  signOutAffiliate: vi.fn(),
}));

import { AffiliateDashboardShell } from "@/components/affiliate/AffiliateDashboardShell";

describe("AffiliateDashboardShell", () => {
  it("routes every portal section and exposes profile and sign-out controls", () => {
    render(
      <AffiliateDashboardShell
        email="alex@example.com"
        fullName="Alex Affiliate"
        referralCode="GODA1234"
      >
        <p>Dashboard content</p>
      </AffiliateDashboardShell>,
    );

    const navigation = within(
      screen.getByRole("navigation", { name: "Affiliate navigation" }),
    );
    for (const [label, href] of [
      ["Dashboard", "/affiliate-dashboard"],
      ["Balance", "/affiliate-dashboard/balance"],
      ["Payouts history", "/affiliate-dashboard/payouts"],
      ["Referral links", "/affiliate-dashboard/links"],
      ["Disputes", "/affiliate-dashboard/disputes"],
      ["KYC", "/affiliate-dashboard/kyc"],
    ]) {
      expect(navigation.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }

    expect(
      navigation.getByRole("link", { name: "Referral links" }),
    ).toHaveAttribute("aria-current", "page");
    const profileName = screen.getByText("Alex Affiliate");
    fireEvent.click(profileName.closest("summary")!);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/affiliate-dashboard/profile",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
