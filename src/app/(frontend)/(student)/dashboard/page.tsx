import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight">Student Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Pick up where you left off or browse the lessons available to you.
        </p>
        <section className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Your learning library</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            View your enrolled courses and available previews, then open a lesson to watch and take
            its video check-ins.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/dashboard/courses"
          >
            Browse my courses
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
