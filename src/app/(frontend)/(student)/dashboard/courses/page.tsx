import Link from "next/link";
import { getPayload } from "payload";
import { redirect } from "next/navigation";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { getStudentLearningActivity } from "@/lib/student-learning-activity";
import { normalizeStudentEmail } from "@/lib/student-email";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";
import type { Course, Lesson, Module } from "../../../../../../payload-types";

function getRelationId(relation: number | { id: number }) {
  return typeof relation === "number" ? relation : relation.id;
}

type StudentCoursesPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

export default async function StudentCoursesPage({ searchParams }: StudentCoursesPageProps) {
  const { payment } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const activity = getStudentLearningActivity(user.user_metadata?.student_learning);

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
  const activeCourseIds = new Set(
    enrollmentsResult.docs.map((enrollment) => getRelationId(enrollment.course)),
  );
  const startedCourseIds = new Set(
    Object.values(activity.lessons)
      .filter((lessonActivity) => lessonActivity.watchedSeconds > 0 || lessonActivity.completedAt)
      .map((lessonActivity) => lessonActivity.courseId),
  );
  const courseIds = [...new Set([...activeCourseIds, ...startedCourseIds])];

  if (courseIds.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardPageBanner description="Continue learning with the courses you have enrolled in." icon="lucide:book-open-check" title="My Courses" />
        {payment && <PaymentNotice payment={payment} />}
        <EmptyCourses />
      </main>
    );
  }

  const [coursesResult, modulesResult] = await Promise.all([
    payload.find({
      collection: "courses",
      where: {
        and: [
          { id: { in: courseIds } },
          { status: { equals: "published" } },
        ],
      },
      limit: courseIds.length,
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: "modules",
      where: { course: { in: courseIds } },
      limit: 10000,
      pagination: false,
      overrideAccess: true,
    }),
  ]);
  const courses = coursesResult.docs as Course[];
  const modules = modulesResult.docs as Module[];
  const moduleIds = modules.map((module) => module.id);
  const lessonsResult = moduleIds.length
    ? await payload.find({
        collection: "lessons",
        where: { module: { in: moduleIds } },
        limit: 10000,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Lesson[] };
  const lessons = lessonsResult.docs as Lesson[];
  const modulesByCourse = new Map<number, Module[]>();
  for (const module of modules) {
    const courseId = getRelationId(module.course);
    const courseModules = modulesByCourse.get(courseId) ?? [];
    courseModules.push(module);
    modulesByCourse.set(courseId, courseModules);
  }
  const lessonsByModule = new Map<number, Lesson[]>();
  for (const lesson of lessons) {
    const moduleId = getRelationId(lesson.module);
    const moduleLessons = lessonsByModule.get(moduleId) ?? [];
    moduleLessons.push(lesson);
    lessonsByModule.set(moduleId, moduleLessons);
  }

  const availableCourses = courses
    .map((course) => {
      const courseModules = (modulesByCourse.get(course.id) ?? []).sort(
        (first, second) => first.sortOrder - second.sortOrder,
      );
      const availableModules = courseModules
        .map((module) => ({
          ...module,
          lessons: (lessonsByModule.get(module.id) ?? [])
            .filter((lesson) => activeCourseIds.has(course.id) || lesson.isPreview)
            .sort((first, second) => first.sortOrder - second.sortOrder),
        }))
        .filter((module) => module.lessons.length > 0);

      return {
        ...course,
        modules: availableModules,
        enrolled: activeCourseIds.has(course.id),
        started: startedCourseIds.has(course.id),
      };
    })
    .filter((course) => course.enrolled || course.started);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner description="Continue learning with the courses you have enrolled in." icon="lucide:book-open-check" title="My Courses" />
      {payment && <PaymentNotice payment={payment} />}

      {availableCourses.length ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {availableCourses.map((course) => {
            const firstLesson = course.modules[0]?.lessons[0];
            const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
            const completedLessons = course.modules.reduce(
              (total, module) => total + module.lessons.filter(
                (lesson) => Boolean(activity.lessons[String(lesson.id)]?.completedAt),
              ).length,
              0,
            );
            const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
            const courseState = progress === 100 && totalLessons
              ? course.enrolled ? "Completed" : "Preview complete"
              : completedLessons > 0 || course.started
                ? "In progress"
                : course.enrolled
                  ? "Not started"
                  : "Preview started";
            return (
              <Link
                aria-label={`Continue ${course.title}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-[#068365]/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={firstLesson ? `/dashboard/lessons/${firstLesson.id}` : "/catalog"}
                key={course.id}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" src={course.thumbnailUrl} />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-zinc-800">
                    {course.priceUSD === 0 ? "Free" : "Paid"}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold leading-snug">{course.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:book-open" />
                      {totalLessons} lessons
                    </span>
                    <span className="text-xs font-semibold text-[#068365]">{course.enrolled ? "Enrolled" : "Preview"}</span>
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Course progress</span>
                      <span className="text-muted-foreground">{progress}% · {courseState}</span>
                    </div>
                    <div aria-label={`${progress}% complete`} className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-[#068365] transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {totalLessons
                        ? `${completedLessons} of ${totalLessons} lessons completed`
                        : "Course lessons are being prepared."}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyCourses />
      )}
    </main>
  );
}

function PaymentNotice({ payment }: { payment: string }) {
  return (
    <p
      className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="status"
    >
      {payment === "verification-unavailable"
        ? "We couldn't verify the payment because checkout verification is temporarily unavailable. Contact support before trying again."
        : "Your payment has not been confirmed, so the course has not been activated. You can retry checkout from the course catalog."}
    </p>
  );
}

function EmptyCourses() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <DashboardIcon aria-hidden="true" className="mx-auto size-9 text-muted-foreground" icon="lucide:book-open" />
        <h2 className="mt-3 text-lg font-semibold">No enrolled courses yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Once you enroll in or activate a course, it will appear here with its lessons and progress.
        </p>
        <Link className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#068365] px-4 text-sm font-semibold text-white hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/catalog">
          Explore courses <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:arrow-right" />
        </Link>
      </div>
      <article aria-label="Example of a course card" className="overflow-hidden rounded-2xl border border-border bg-card">
        <div aria-hidden="true" className="grid aspect-[2.4] place-items-center bg-gradient-to-br from-[#073b31] to-[#068365] text-white/80">
          <DashboardIcon className="size-10" icon="lucide:graduation-cap" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Example course card</p>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Preview</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Published courses will show their lesson count and your saved progress here.</p>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span>Course progress</span>
            <span className="text-muted-foreground">0%</span>
          </div>
          <div aria-hidden="true" className="mt-2 h-1.5 rounded-full bg-muted" />
        </div>
      </article>
    </div>
  );
}