"use client";

import { signOutStudent } from "@/app/(frontend)/(student)/dashboard/actions";
import { AuthSignOutForm } from "./AuthSignOutForm";

export function StudentSignOutForm() {
  return (
    <AuthSignOutForm
      action={signOutStudent}
      buttonClassName="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      destination="/sign-in"
    >
      Confirm sign out
    </AuthSignOutForm>
  );
}
