"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentAccount } from "../actions";

export default function DeleteAccountPage() {
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function confirmDeletion() {
    setError("");
    setDeleting(true);
    const result = await deleteStudentAccount();
    if (result.error) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    router.replace("/sign-in?account=deleted");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      <section className="rounded-xl border border-destructive/30 bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-destructive">Delete your account?</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This permanently deletes your student profile and enrollments and removes your Supabase sign-in. It cannot be undone.
        </p>
        {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/settings">
            Cancel
          </Link>
          <button className="min-h-10 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50" disabled={deleting} onClick={() => void confirmDeletion()} type="button">
            {deleting ? "Deleting account…" : "Delete account"}
          </button>
        </div>
      </section>
    </main>
  );
}
