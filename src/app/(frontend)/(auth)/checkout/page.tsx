import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { findPublishedCourseBySlug } from "@/lib/course-enrollment";
import { CheckoutPanel } from "@/components/CheckoutPanel";

type CheckoutPageProps = {
  searchParams: Promise<{ course?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { course: courseSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(courseSlug ? `/sign-in?course=${encodeURIComponent(courseSlug)}` : "/sign-in");
  if (!courseSlug) redirect("/dashboard");

  const payload = await getPayload({ config });
  const course = await findPublishedCourseBySlug(payload, courseSlug);
  if (!course) notFound();
  if (course.priceUSD <= 0) {
    redirect(`/enroll/continue?course=${encodeURIComponent(course.slug)}`);
  }

  return <CheckoutPanel courseTitle={course.title} courseSlug={course.slug} priceUSD={course.priceUSD} />;
}
