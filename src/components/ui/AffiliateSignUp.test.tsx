import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/AuroraHero", () => ({
  AuroraHero: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

import AffiliateSignUp from "@/components/ui/AffiliateSignUp";

describe("AffiliateSignUp", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Application received." }),
      }),
    );
  });

  it("confirms the review process and sends the notification without leaving the form", async () => {
    const formSubmit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
    const { container } = render(<AffiliateSignUp />);
    const form = container.querySelector("form");

    expect(form).not.toBeNull();
    expect(screen.getByLabelText("First name")).toBeRequired();
    expect(screen.getByLabelText("Last name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Phone number")).toBeRequired();
    expect(screen.getByLabelText("Why do you want to join?")).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Affiliate" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+1 555 555 0100" } });
    fireEvent.change(screen.getByLabelText("Why do you want to join?"), {
      target: { value: "I would like to promote Godaapp courses." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(form!);

    await waitFor(() => expect(formSubmit).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      "/api/affiliate/applications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fullName: "Alex Affiliate",
          email: "alex@example.com",
          phone: "+1 555 555 0100",
          message: "I would like to promote Godaapp courses.",
          termsAccepted: true,
        }),
      }),
    );
    expect(form).toHaveAttribute("target", "affiliate-application-notification");
    expect(screen.getByRole("button", { name: /submitted/i })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/Your application is under review\./);
    expect(screen.getByRole("status")).toHaveTextContent(/You can sign in after approval\./);
    expect(screen.getByRole("link", { name: "affiliate sign-in" })).toHaveAttribute(
      "href",
      "/affiliate/sign-in",
    );
  });

  it("shows a persistence failure and does not send the notification form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Application unavailable." }),
      }),
    );
    const formSubmit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
    const { container } = render(<AffiliateSignUp />);

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Affiliate" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+1 555 555 0100" } });
    fireEvent.change(screen.getByLabelText("Why do you want to join?"), {
      target: { value: "I would like to promote Godaapp courses." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Application unavailable.");
    expect(formSubmit).not.toHaveBeenCalled();
  });

  it("confirms an application after returning from the notification form", async () => {
    window.history.replaceState({}, "", "/affiliate?application=received");
    render(<AffiliateSignUp />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your application is under review.",
    );
  });
});
