export type StudentLessonActivity = {
  courseId: number;
  watchedSeconds: number;
  lastWatchedAt: string;
  completedAt?: string;
};

export type StudentLearningActivity = {
  lessons: Record<string, StudentLessonActivity>;
  dailySeconds: Record<string, number>;
};

export function getStudentLearningActivity(value: unknown): StudentLearningActivity {
  if (!value || typeof value !== "object") {
    return { lessons: {}, dailySeconds: {} };
  }

  const data = value as Record<string, unknown>;
  const lessons: StudentLearningActivity["lessons"] = {};
  const dailySeconds: StudentLearningActivity["dailySeconds"] = {};

  if (data.lessons && typeof data.lessons === "object") {
    for (const [lessonId, rawActivity] of Object.entries(data.lessons)) {
      if (!/^\d+$/.test(lessonId) || Number(lessonId) < 1) continue;
      if (!rawActivity || typeof rawActivity !== "object") continue;
      const activity = rawActivity as Record<string, unknown>;
      if (
        typeof activity.courseId !== "number" ||
        !Number.isInteger(activity.courseId) ||
        activity.courseId < 1 ||
        typeof activity.watchedSeconds !== "number" ||
        !Number.isFinite(activity.watchedSeconds) ||
        typeof activity.lastWatchedAt !== "string"
      ) {
        continue;
      }

      lessons[lessonId] = {
        courseId: activity.courseId,
        watchedSeconds: Math.max(0, Math.floor(activity.watchedSeconds)),
        lastWatchedAt: activity.lastWatchedAt,
        ...(typeof activity.completedAt === "string" ? { completedAt: activity.completedAt } : {}),
      };
    }
  }

  if (data.dailySeconds && typeof data.dailySeconds === "object") {
    for (const [day, seconds] of Object.entries(data.dailySeconds)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof seconds === "number" && Number.isFinite(seconds)) {
        dailySeconds[day] = Math.min(86_400, Math.max(0, Math.floor(seconds)));
      }
    }
  }

  return { lessons, dailySeconds };
}
