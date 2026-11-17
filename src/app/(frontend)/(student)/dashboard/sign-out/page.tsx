import Link from "next/link";
import { StudentSignOutForm } from "@/components/auth/StudentSignOutForm";

export default function SignOutConfirmationPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold">Sign out?</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You’ll be returned to the GodaApp sign-in page. You can cancel and remain signed in.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted" href="/dashboard">
            Cancel
          </Link>
          <StudentSignOutForm />
        </div>
      </section>
    </main>
  );
}
