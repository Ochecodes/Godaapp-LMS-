import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";

const mocks = vi.hoisted(() => ({
  checkoutOpen: vi.fn(),
  initialize: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/script", () => ({
  default: ({ onReady, onError }: { onReady?: () => void; onError?: () => void }) => (
    <>
      <button onClick={() => onReady?.()} type="button">Ready Bachs script</button>
      <button onClick={() => onError?.()} type="button">Bachs script error</button>
    </>
  ),
}));

import { CheckoutPanel } from "@/components/CheckoutPanel";

describe("CheckoutPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mocks.initialize.mockReset();
    mocks.checkoutOpen.mockReset().mockResolvedValue(undefined);
    window.Bachs = {
      Initialize: mocks.initialize,
      Checkout: { open: mocks.checkoutOpen },
    };
  });

  it("shows the course price and keeps checkout disabled until the SDK is ready", () => {
    render(
      <CheckoutPanel
        courseTitle="Investing Basics"
        courseSlug="investing-basics"
        priceUSD={49.99}
      />,
    );

    expect(screen.getByText("Investing Basics")).toBeInTheDocument();
    expect(screen.getByText("$49.99 USD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Loading secure checkout…" }),
    ).toBeDisabled();
  });

  it("starts a server-created checkout and opens it in the Bachs overlay", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ checkoutUrl: "https://checkout.bachs.io/session/checkout_1" }),
    );
    render(
      <CheckoutPanel
        courseTitle="Investing Basics"
        courseSlug="investing-basics"
        priceUSD={49.99}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Ready Bachs script" }));
    expect(mocks.initialize).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Continue to secure checkout" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/payments/bachs/initialize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ course: "investing-basics" }),
      }),
    );
    expect(mocks.checkoutOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        checkoutUrl: "https://checkout.bachs.io/session/checkout_1",
        options: { autoCloseOnComplete: false },
      }),
    );

    const checkoutOptions = mocks.checkoutOpen.mock.calls[0][0];
    checkoutOptions.onEvent({ type: "checkout.completed" });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your enrollment will activate after server confirmation.",
    );
  });

  it("reports failed server initialization without opening the provider overlay", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "Checkout unavailable" }, { status: 503 }),
    );
    render(
      <CheckoutPanel
        courseTitle="Investing Basics"
        courseSlug="investing-basics"
        priceUSD={49.99}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Ready Bachs script" }));
    await user.click(screen.getByRole("button", { name: "Continue to secure checkout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Checkout unavailable");
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
    expect(mocks.checkoutOpen).not.toHaveBeenCalled();
  });

  it("shows a clear error if the checkout SDK script fails to load", async () => {
    const user = userEvent.setup();
    window.Bachs = undefined;
    render(
      <CheckoutPanel
        courseTitle="Investing Basics"
        courseSlug="investing-basics"
        priceUSD={49.99}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ready Bachs script" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bachs checkout could not be loaded",
    );
  });
});
