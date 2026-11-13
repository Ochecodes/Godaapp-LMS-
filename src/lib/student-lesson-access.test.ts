import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Course, Lesson, Module } from "../../payload-types";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getPayload: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("@/payload.config", () => ({ default: {} }));

import { getStudentLessonAccess, getStudentLessonView } from "@/lib/student-lesson-access";

const user = {
  id: "supabase-user",
  email: "student@example.com",
  user_metadata: {
    student_learning: {
      lessons: {
        "3": {
          courseId: 7,
          watchedSeconds: 240,
          lastWatchedAt: "2026-11-18T10:00:00.000Z",
          completedAt: "2026-11-18T10:01:00.000Z",
        },
        "5": {
          courseId: 99,
          watchedSeconds: 240,
          lastWatchedAt: "2026-11-18T10:00:00.000Z",
          completedAt: "2026-11-18T10:01:00.000Z",
        },
      },
    },
  },
};

const freeCourse = {
  id: 7,
  title: "Free course",
  slug: "free-course",
  priceUSD: 0,
  status: "published",
} as Course;

const paidCourse = {
  ...freeCourse,
  id: 8,
  title: "Paid course",
  slug: "paid-course",
  priceUSD: 90,
} as Course;

const moduleA = { id: 1, name: "Foundations", course: freeCourse, sortOrder: 1 } as Module;
const moduleB = { id: 2, name: "Next steps", course: freeCourse, sortOrder: 2 } as Module;

function lesson(
  id: number,
  title: string,
  module: number | Module,
  sortOrder: number,
  options: { isPreview?: boolean; durationSeconds?: number } = {},
) {
  return {
    id,
    title,
    module,
    youtubeVideoId: "video-id",
    sortOrder,
    isPreview: options.isPreview ?? false,
    durationSeconds: options.durationSeconds,
  } as Lesson;
}

function setup({
  course = freeCourse,
  currentLesson = lesson(1, "Introduction", moduleA, 1),
  courseLessons = [
    lesson(5, "Advanced", 2, 1, { durationSeconds: 90 }),
    lesson(3, "Second lesson", 1, 2, { durationSeconds: 3600 }),
    lesson(1, "Introduction", 1, 1, { durationSeconds: 65 }),
  ],
  enrolled = false,
}: {
  course?: Course;
  currentLesson?: Lesson;
  courseLessons?: Lesson[];
  enrolled?: boolean;
} = {}) {
  const payload = {
    find: vi.fn(),
    findByID: vi.fn(),
  };
  const responses: Array<{ docs: unknown[] }> = [
    { docs: [{ ...currentLesson, module: { ...moduleA, course } }] },
  ];
  if (course.priceUSD > 0) responses.push({ docs: enrolled ? [{ id: 41 }] : [] });
  responses.push({ docs: [moduleB, moduleA] }, { docs: courseLessons });
  for (const response of responses) payload.find.mockResolvedValueOnce(response);
  mocks.getPayload.mockResolvedValue(payload);
  mocks.createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  });
  return payload;
}

describe("student lesson access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens every lesson in a published free course and builds ordered completion progress", async () => {
    const payload = setup();

    const view = await getStudentLessonView(1);

    expect(view?.canView).toBe(true);
    expect(view?.outline.map((courseModule) => courseModule.name)).toEqual([
      "Foundations",
      "Next steps",
    ]);
    expect(view?.outline[0].lessons.map(({ id }) => id)).toEqual([1, 3]);
    expect(view?.outline[0].lessons.every(({ canView }) => canView)).toBe(true);
    expect(view?.outline[0].lessons[0]).toMatchObject({
      durationSeconds: 65,
      isCurrent: true,
      isCompleted: false,
    });
    expect(view).toMatchObject({
      completedLessonCount: 1,
      totalLessonCount: 3,
      previousLesson: null,
      nextLesson: { id: 3, isCompleted: true, canView: true },
    });
    expect(payload.find).toHaveBeenCalledTimes(3);
    expect(payload.find.mock.calls.map(([args]) => args.collection)).toEqual([
      "lessons",
      "modules",
      "lessons",
    ]);
  });

  it("keeps paid lessons locked except previews when the student has no active enrollment", async () => {
    setup({
      course: paidCourse,
      currentLesson: lesson(1, "Preview", moduleA, 1, { isPreview: true }),
      courseLessons: [
        lesson(1, "Preview", 1, 1, { isPreview: true }),
        lesson(3, "Second lesson", 1, 2, { durationSeconds: 3600 }),
        lesson(5, "Advanced", 2, 1, { durationSeconds: 90 }),
      ],
    });

    const view = await getStudentLessonView(1);

    expect(view?.canView).toBe(true);
    expect(view?.outline[0].lessons[0].canView).toBe(true);
    expect(view?.outline[0].lessons[1].canView).toBe(false);
    expect(view?.nextLesson).toMatchObject({ id: 3, canView: false });
  });

  it("unlocks the full paid course for an enrolled student", async () => {
    setup({
      course: paidCourse,
      currentLesson: lesson(3, "Second lesson", moduleA, 2),
      enrolled: true,
    });

    const view = await getStudentLessonView(3);

    expect(view?.canView).toBe(true);
    expect(view?.outline.flatMap(({ lessons }) => lessons).every(({ canView }) => canView)).toBe(true);
    expect(view?.previousLesson).toMatchObject({ id: 1, canView: true });
    expect(view?.nextLesson).toMatchObject({ id: 5, canView: true });
  });

  it("does not fetch the outline for quiz or progress authorization", async () => {
    const payload = setup({
      course: paidCourse,
      currentLesson: lesson(1, "Preview", moduleA, 1, { isPreview: true }),
    });

    const access = await getStudentLessonAccess(1);

    expect(access?.canView).toBe(true);
    expect(payload.find).toHaveBeenCalledTimes(1);
    expect(payload.findByID).not.toHaveBeenCalled();
  });

  it("rejects unpublished courses before loading their lesson outline", async () => {
    const payload = setup({
      course: { ...freeCourse, status: "draft" } as Course,
    });

    await expect(getStudentLessonView(1)).resolves.toBeNull();
    expect(payload.find).toHaveBeenCalledTimes(1);
  });
});
