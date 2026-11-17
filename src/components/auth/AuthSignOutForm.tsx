"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { broadcastAuthSignOut } from "./AuthLogoutSync";

type SignOutActionResult = {
  error?: string;
  userId?: string | null;
};

type AuthSignOutFormProps = {
  action: () => Promise<SignOutActionResult>;
  destination: "/sign-in" | "/affiliate/sign-in";
  buttonClassName: string;
  children: ReactNode;
};

export function AuthSignOutForm({
  action,
  destination,
  buttonClassName,
  children,
}: AuthSignOutFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.userId) broadcastAuthSignOut(result.userId, destination);
        router.replace(destination);
        router.refresh();
      } catch {
        setError("Sign out could not be completed. Please try again.");
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-destructive" role="alert">{error}</p>}
      <form action={submit}>
        <button
          className={buttonClassName}
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing out…" : children}
        </button>
      </form>
    </div>
  );
}
