import { redirect } from "next/navigation";

type CheckoutPageProps = {
  searchParams: Promise<{ course?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { course: courseSlug } = await searchParams;
  if (!courseSlug) redirect("/dashboard");
  redirect(`/enroll/continue?course=${encodeURIComponent(courseSlug)}`);
}
