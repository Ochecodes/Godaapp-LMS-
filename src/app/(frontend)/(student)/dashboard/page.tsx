import { getPayload } from "payload";
import { redirect } from "next/navigation";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { getCourseInstructorName } from "@/lib/course-instructor";
import { getStudentLearningActivity } from "@/lib/student-learning-activity";
import { normalizeStudentEmail } from "@/lib/student-email";
import { StudentDashboardOverview } from "@/components/StudentDashboardOverview";
import type { Course, Enrollment, Lesson, Module } from "../../../../../payload-types";

export const dynamic = "force-dynamic";

function getRelationId(relation: number | { id: number }) {
  return typeof relation === "number" ? relation : relation.id;
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const activity = getStudentLearningActivity(user.user_metadata?.student_learning);

  const payload = await getPayload({ config });
  const enrollments = await payload.find({
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
  const courseIds = [...new Set((enrollments.docs as Enrollment[]).map((enrollment) => getRelationId(enrollment.course)))];
  const coursesResult = courseIds.length
    ? await payload.find({
        collection: "courses",
        where: { id: { in: courseIds }, status: { equals: "published" } },
        limit: courseIds.length,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Course[] };
  const courses = coursesResult.docs as Course[];
  const modulesResult = courses.length
    ? await payload.find({
        collection: "modules",
        where: { course: { in: courses.map((course) => course.id) } },
        limit: 10000,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Module[] };
  const moduleIds = (modulesResult.docs as Module[]).map((module) => module.id);
  const lessonsResult = moduleIds.length
    ? await payload.find({
        collection: "lessons",
        where: { module: { in: moduleIds } },
        limit: 10000,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Lesson[], totalDocs: 0 };

  const lessons = lessonsResult.docs as Lesson[];
  const courseLessonCounts = new Map<number, number>(
    courses.map((course) => [course.id, 0]),
  );
  const courseCompletedCounts = new Map<number, number>();
  const watchedLessonIds = new Set(
    Object.entries(activity.lessons)
      .filter(([, lessonActivity]) => lessonActivity.watchedSeconds > 0 || lessonActivity.completedAt)
      .map(([lessonId]) => Number(lessonId)),
  );
  const completedLessonIds = new Set(
    Object.entries(activity.lessons)
      .filter(([, lessonActivity]) => Boolean(lessonActivity.completedAt))
      .map(([lessonId]) => Number(lessonId)),
  );

  const moduleCourseIds = new Map(
    (modulesResult.docs as Module[]).map((module) => [module.id, getRelationId(module.course)]),
  );
  for (const lesson of lessons) {
    const courseId = moduleCourseIds.get(getRelationId(lesson.module));
    if (courseId === undefined) continue;
    courseLessonCounts.set(courseId, (courseLessonCounts.get(courseId) ?? 0) + 1);
    if (completedLessonIds.has(lesson.id)) {
      courseCompletedCounts.set(courseId, (courseCompletedCounts.get(courseId) ?? 0) + 1);
    }
  }

  const completedCourseCount = [...courseLessonCounts].filter(
    ([courseId, total]) => total > 0 && (courseCompletedCounts.get(courseId) ?? 0) >= total,
  ).length;
  const inProgressCourseCount = [...courseLessonCounts].filter(
    ([courseId, total]) => {
      const completed = courseCompletedCounts.get(courseId) ?? 0;
      const started = Object.values(activity.lessons).some(
        (lessonActivity) => lessonActivity.courseId === courseId && (
          lessonActivity.watchedSeconds > 0 || Boolean(lessonActivity.completedAt)
        ),
      );
      return total > 0 && started && completed < total;
    },
  ).length;

  const today = new Date();
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(utcToday);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const day = date.toISOString().slice(0, 10);
    return {
      day,
      label: new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(date),
      seconds: activity.dailySeconds[day] ?? 0,
    };
  });
  const activityGrid = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(utcToday);
    date.setUTCDate(date.getUTCDate() - (83 - index));
    const day = date.toISOString().slice(0, 10);
    return { day, seconds: activity.dailySeconds[day] ?? 0 };
  });

  const now = Date.now();
  const upcomingClasses = courses.flatMap((course) =>
    (course.liveClasses ?? [])
      .filter((liveClass) => Date.parse(liveClass.endsAt) > now)
      .map((liveClass, index) => ({
        id: `${course.id}-${liveClass.id ?? index}`,
        title: liveClass.title,
        courseTitle: course.title,
        instructorName: liveClass.instructorName?.trim() || getCourseInstructorName(course.title),
        startsAt: liveClass.startsAt,
      })),
  ).sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));

  return (
    <StudentDashboardOverview
      courseCount={courses.length}
      inProgressCount={inProgressCourseCount}
      completedCount={completedCourseCount}
      lessonCount={watchedLessonIds.size}
      availableLessonCount={lessonsResult.totalDocs}
      weeklyActivity={weeklyActivity}
      activityGrid={activityGrid}
      upcomingClasses={upcomingClasses}
    />
  );
}
