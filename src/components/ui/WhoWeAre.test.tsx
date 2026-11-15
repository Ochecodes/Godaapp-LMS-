import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <div aria-label={alt} data-src={src} role="img" />
  ),
}));

import { WhoWeAre } from "@/components/ui/WhoWeAre";

describe("WhoWeAre", () => {
  it("shows the community image and links to the About page", () => {
    render(<WhoWeAre />);

    expect(screen.getByRole("region", { name: "Who we are" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Who we are" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "A member of the GodaApp community" })).toHaveAttribute(
      "data-src",
      "/WhoWeAre.avif",
    );
    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute("href", "/about");
  });
});
