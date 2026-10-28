import Link from "next/link";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { ensureCourseEnrollment, findPublishedCourseBySlug } from "@/lib/course-enrollment";

type ContinuePageProps = {
  searchParams: Promise<{ course?: string }>;
};

export default async function ContinueEnrollmentPage({ searchParams }: ContinuePageProps) {
  const { course: courseSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(courseSlug ? `/sign-in?course=${encodeURIComponent(courseSlug)}` : "/sign-in");
  }
  if (!courseSlug) redirect("/dashboard");

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, courseSlug);
  if (!course) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Course unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course could not be found or is not currently published.
          </p>
          <Link className="mt-5 inline-block text-sm font-semibold text-primary hover:underline" href="/catalog">
            Return to the catalog
          </Link>
        </div>
      </main>
    );
  }

  if (course.priceUSD > 0) {
    redirect(`/checkout?course=${encodeURIComponent(course.slug)}`);
  }
  if (course.priceUSD !== 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Course price unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course cannot be enrolled in until its price is corrected.
          </p>
        </div>
      </main>
    );
  }

  await ensureCourseEnrollment(payload, user, course);
  redirect("/dashboard");
}
