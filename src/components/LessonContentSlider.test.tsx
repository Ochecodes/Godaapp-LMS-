import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonContentSlider } from "./LessonContentSlider";

describe("LessonContentSlider", () => {
  it("moves through scrollable lesson sections with accessible controls", () => {
    render(
      <LessonContentSlider>
        <p>First section</p>
        <p>Second section</p>
      </LessonContentSlider>,
    );

    const previous = screen.getByRole("button", { name: "Previous lesson content section" });
    const next = screen.getByRole("button", { name: "Next lesson content section" });

    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(screen.getByText("Section 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Scrollable lesson content section 1 of 2")).toHaveClass(
      "overflow-y-auto",
      "max-h-[28rem]",
    );

    fireEvent.click(next);
    expect(screen.getByText("Second section")).toBeInTheDocument();
    expect(screen.getByText("Section 2 of 2")).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();

    fireEvent.click(previous);
    expect(screen.getByText("First section")).toBeInTheDocument();
  });
});
