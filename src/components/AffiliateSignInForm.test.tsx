import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/AuroraHero", () => ({
  AuroraHero: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

import { AffiliateSignInForm } from "@/components/AffiliateSignInForm";

describe("AffiliateSignInForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "If approved, check your email." }),
      }),
    );
  });

  it("collects name and email and displays the OTP confirmation", async () => {
    render(<AffiliateSignInForm />);

    expect(
      screen.getByRole("img", { name: /affiliate learning/i }).getAttribute("src"),
    ).toContain("afi.avif");
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Alex Affiliate" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/affiliate/sign-in",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            fullName: "Alex Affiliate",
            email: "alex@example.com",
          }),
        }),
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If approved, check your email.",
    );
  });

  it("shows errors returned by the sign-in endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Too many sign-in attempts." }),
      }),
    );
    render(<AffiliateSignInForm />);
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Alex Affiliate" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many sign-in attempts.",
    );
  });
});
