import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getAuthorizedStudentLesson } from "@/lib/student-lesson-access";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function StudentLessonPage({ params }: LessonPageProps) {
  const { lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isInteger(lessonId) || lessonId < 1) notFound();

  const access = await getAuthorizedStudentLesson(lessonId);
  if (!access) notFound();

  return (
    <LessonPlayer
      courseTitle={access.course.title}
      lessonId={access.lesson.id}
      lessonTitle={access.lesson.title}
      moduleTitle={access.module.name}
      videoId={access.lesson.youtubeVideoId}
    />
  );
}
