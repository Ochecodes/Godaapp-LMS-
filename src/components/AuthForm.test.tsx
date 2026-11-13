import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

vi.mock("@/components/ui/AuroraHero", () => ({
  AuroraHero: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { AuthForm } from "@/components/AuthForm";

describe("AuthForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    navigation.replace.mockReset();
    window.history.replaceState({}, "", "/sign-in");
  });

  it("uses a client-side route transition after successful sign-in", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(Response.json({ ok: true }));
    render(<AuthForm mode="sign-in" />);

    await user.type(screen.getByLabelText("Email address"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "secure-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("submits a sign-up request with the selected course and shows verification status", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ requiresEmailVerification: true }),
    );
    window.history.replaceState({}, "", "/sign-up?course=investing-basics");
    render(<AuthForm mode="sign-up" />);

    await user.type(screen.getByLabelText("Full name"), "Student Example");
    await user.type(screen.getByLabelText("Email address"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "secure-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email to verify your account.",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          action: "sign-up",
          email: "student@example.com",
          password: "secure-password",
          fullName: "Student Example",
          next: "/enroll/continue?course=investing-basics",
        }),
      }),
    );
  });

  it("conveys server rate limits clearly and keeps password visibility accessible", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "Too many attempts" }, { status: 429 }),
    );
    render(<AuthForm mode="sign-in" />);

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.type(screen.getByLabelText("Email address"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Please wait a few minutes before trying again.",
    );
  });

  it("does not submit invalid email/password fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(fetch).not.toHaveBeenCalled();
  });
});
