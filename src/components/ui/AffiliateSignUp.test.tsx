import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/AuroraHero", () => ({
  AuroraHero: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

import AffiliateSignUp from "@/components/ui/AffiliateSignUp";

describe("AffiliateSignUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("requires applicant details and shows the submitted state before sending the form", () => {
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

    fireEvent.submit(form!);

    expect(screen.getByRole("button", { name: /submitted/i })).toBeDisabled();
    expect(formSubmit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(850);
    });

    expect(formSubmit).toHaveBeenCalledTimes(1);
  });
});
