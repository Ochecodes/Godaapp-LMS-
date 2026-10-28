import Link from "next/link";
import { getPayload } from "payload";
import { BookOpen, Play } from "lucide-react";
import { redirect } from "next/navigation";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
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

  const payload = await getPayload({ config });
  const coursesResult = await payload.find({
    collection: "courses",
    where: { status: { equals: "published" } },
    limit: 1000,
    overrideAccess: true,
  });
  const courses = coursesResult.docs as Course[];
  const courseIds = courses.map((course) => course.id);

  if (courseIds.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight">My courses</h1>
          {payment && <PaymentNotice payment={payment} />}
          <EmptyCourses />
        </div>
      </main>
    );
  }

  const [modulesResult, enrollmentsResult] = await Promise.all([
    payload.find({
      collection: "modules",
      where: { course: { in: courseIds } },
      limit: 10000,
      pagination: false,
      overrideAccess: true,
    }),
    payload.find({
      collection: "enrollments",
      where: { isActive: { equals: true } },
      limit: 10000,
      pagination: false,
      overrideAccess: true,
    }),
  ]);
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
  const activeCourseIds = new Set(
    enrollmentsResult.docs
      .filter((enrollment) => enrollment.email.trim().toLowerCase() === user.email?.trim().toLowerCase())
      .map((enrollment) => getRelationId(enrollment.course)),
  );
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
            .filter((lesson) => lesson.isPreview || activeCourseIds.has(course.id))
            .sort((first, second) => first.sortOrder - second.sortOrder),
        }))
        .filter((module) => module.lessons.length > 0);

      return {
        ...course,
        modules: availableModules,
        enrolled: activeCourseIds.has(course.id),
      };
    })
    .filter((course) => course.modules.length > 0);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          href="/dashboard"
        >
          ← Student dashboard
        </Link>
        <div className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight">My courses</h1>
          <p className="mt-2 text-muted-foreground">
            Continue a course or explore its available preview lessons.
          </p>
        </div>
        {payment && <PaymentNotice payment={payment} />}

        {availableCourses.length ? (
          <div className="mt-8 space-y-6">
            {availableCourses.map((course) => (
              <section
                key={course.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-lg font-semibold">{course.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {course.enrolled ? "Enrolled" : "Preview"}
                  </span>
                </header>
                <div className="divide-y divide-border">
                  {course.modules.map((module) => (
                    <div key={module.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[12rem_1fr] sm:px-6">
                      <h3 className="text-sm font-semibold">{module.name}</h3>
                      <ul className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <Link
                              className="group flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              href={`/dashboard/lessons/${lesson.id}`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <BookOpen aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{lesson.title}</span>
                              </span>
                              <Play
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                              />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyCourses />
        )}
      </div>
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
    <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">No lessons available yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        Published courses and preview lessons will appear here when they are ready.
      </p>
    </div>
  );
}