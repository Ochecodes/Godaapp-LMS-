import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteSkeleton } from "@/components/RouteSkeleton";

describe("RouteSkeleton", () => {
  it("announces loading state accessibly with a default label", () => {
    render(<RouteSkeleton />);

    expect(screen.getByRole("status", { name: "Loading page" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByText("Loading page")).toHaveClass("sr-only");
  });

  it.each(["site", "content", "auth", "dashboard"] as const)(
    "renders the %s fallback variant",
    (variant) => {
      render(<RouteSkeleton label={`Loading ${variant}`} variant={variant} />);

      expect(screen.getByRole("status", { name: `Loading ${variant}` })).toBeInTheDocument();
      expect(screen.getByLabelText(`Loading ${variant}`)).toHaveAttribute("aria-busy", "true");
    },
  );
});
