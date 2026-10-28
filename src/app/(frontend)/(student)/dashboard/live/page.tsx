import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { StudentLiveClasses } from "@/components/StudentLiveClasses";
import type { Course, Enrollment } from "../../../../../../payload-types";

export const dynamic = "force-dynamic";

function getRelationId(relation: number | Course): number {
  return typeof relation === "number" ? relation : relation.id;
}

export default async function StudentLiveClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const payload = await getPayload({ config });
  const enrollmentsResult = await payload.find({
    collection: "enrollments",
    where: { isActive: { equals: true } },
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  });
  const activeEnrollments = (enrollmentsResult.docs as Enrollment[]).filter(
    (enrollment) =>
      enrollment.isActive &&
      enrollment.email.trim().toLowerCase() === user.email?.trim().toLowerCase(),
  );
  const courseIds = [...new Set(activeEnrollments.map((enrollment) => getRelationId(enrollment.course)))];

  if (courseIds.length === 0) {
    return <StudentLiveClasses classes={[]} />;
  }

  const coursesResult = await payload.find({
    collection: "courses",
    where: { id: { in: courseIds } },
    limit: courseIds.length,
    pagination: false,
    overrideAccess: true,
  });
  const classes = (coursesResult.docs as Course[]).flatMap((course) =>
    (course.liveClasses ?? []).map((liveClass, index) => ({
      id: `${course.id}-${liveClass.id ?? index}`,
      courseTitle: course.title,
      title: liveClass.title,
      meetingUrl: liveClass.meetingUrl,
      startsAt: liveClass.startsAt,
      endsAt: liveClass.endsAt,
    })),
  );

  classes.sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));

  return <StudentLiveClasses classes={classes} />;
}