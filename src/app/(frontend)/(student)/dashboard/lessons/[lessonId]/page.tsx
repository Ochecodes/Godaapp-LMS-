import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getStudentLessonView } from "@/lib/student-lesson-access";
import { splitLessonContent } from "@/lib/lesson-content";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const LessonPlayer = dynamic(() => import("@/components/LessonPlayer").then((module) => module.LessonPlayer), {
  loading: () => <div aria-hidden="true" className="mx-auto min-h-[32rem] w-full max-w-7xl animate-pulse motion-reduce:animate-none rounded-2xl bg-muted" />,
});

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function StudentLessonPage({ params }: LessonPageProps) {
  const { lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isInteger(lessonId) || lessonId < 1) notFound();

  const user = await getAuthenticatedUser();
  if (!user) {
    const signInUrl = new URLSearchParams({ next: `/dashboard/lessons/${lessonId}` });
    redirect(`/sign-in?${signInUrl}`);
  }

  const access = await getStudentLessonView(lessonId);
  if (!access) notFound();
  const lessonContentSlides = splitLessonContent(access.lesson.contentBody);
  if (!access.canView) {
    const isPaidCourse = access.course.priceUSD > 0;
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-primary">{access.course.title}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Unlock this lesson</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {isPaidCourse
              ? "This lesson is part of the full course. Enroll to continue learning."
              : "Enroll in this course to access this lesson."}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={`/enroll/continue?course=${encodeURIComponent(access.course.slug)}`}
          >
            {isPaidCourse ? "Purchase course" : "Enroll for free"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <LessonPlayer
      courseTitle={access.course.title}
      lessonId={access.lesson.id}
      lessonTitle={access.lesson.title}
      moduleTitle={access.module.name}
      videoId={access.lesson.youtubeVideoId}
      lessonOutline={access.outline}
      previousLesson={access.previousLesson}
      nextLesson={access.nextLesson}
      completedLessonCount={access.completedLessonCount}
      totalLessonCount={access.totalLessonCount}
      initiallyCompleted={
        access.outline
          .flatMap((courseModule) => courseModule.lessons)
          .find((courseLesson) => courseLesson.isCurrent)?.isCompleted ?? false
      }
    >
      {lessonContentSlides.length ? (
        lessonContentSlides.map((content, index) => (
          <RichText data={content} key={index} />
        ))
      ) : (
        <p className="text-muted-foreground">Lesson notes have not been added yet.</p>
      )}
    </LessonPlayer>
  );
}
