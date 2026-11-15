import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) => <div aria-label={alt} data-src={src} role="img" />,
}));

import { HowItWorks } from "@/components/ui/HowItWorks";

describe("HowItWorks", () => {
  it("shows three non-interactive steps with their intended images", () => {
    render(<HowItWorks />);

    const steps = screen.getByRole("list", { name: "Three steps to get started" });
    const buttons = within(steps).getAllByRole("button");

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "Step 1",
      "Step 2",
      "Step 3",
    ]);
    expect(buttons.every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getByRole("img", { name: "A learner signing in to her digital assets course" })).toHaveAttribute(
      "data-src",
      "/Step1.avif",
    );
    expect(screen.getByRole("img", { name: "Learners exploring a course together" })).toHaveAttribute(
      "data-src",
      "/Step2.avif",
    );
    expect(screen.getByRole("img", { name: "Students learning together" })).toHaveAttribute(
      "data-src",
      "/Step3.avif",
    );
  });
});
