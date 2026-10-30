import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { getCourseInstructorName } from "@/lib/course-instructor";
import { StudentLiveClasses } from "@/components/StudentLiveClasses";
import { normalizeStudentEmail } from "@/lib/student-email";
import type { Course } from "../../../../../../payload-types";

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
    where: {
      and: [
        { email: { equals: normalizeStudentEmail(user.email ?? "") } },
        { isActive: { equals: true } },
      ],
    },
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  });
  const courseIds = [...new Set(enrollmentsResult.docs.map((enrollment) => getRelationId(enrollment.course)))];

  if (courseIds.length === 0) {
    return <StudentLiveClasses classes={[]} scheduleKey={user.id} />;
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
      instructorName: liveClass.instructorName?.trim() || getCourseInstructorName(course.title),
      meetingUrl: liveClass.meetingUrl,
      startsAt: liveClass.startsAt,
      endsAt: liveClass.endsAt,
    })),
  );

  classes.sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));

  return <StudentLiveClasses classes={classes} scheduleKey={user.id} />;
}