import { describe, expect, it } from "vitest";
import { getCourseInstructorName } from "@/lib/course-instructor";
import { isActiveCourseEditor, isActivePayloadAdmin } from "@/lib/payload-access";
import { getStudentLearningActivity } from "@/lib/student-learning-activity";
import { normalizeStudentEmail } from "@/lib/student-email";
import { cn } from "@/lib/utils";

describe("student email normalization", () => {
  it("trims surrounding whitespace and lowercases the address", () => {
    expect(normalizeStudentEmail("  Student@Example.COM  ")).toBe("student@example.com");
  });
});

describe("course instructor selection", () => {
  it.each([
    ["Portfolio construction", "Oche Akor"],
    ["PineScript strategies", "Oche Akor"],
    ["Algorithmic systems", "Oche Akor"],
    ["Crypto risk management", "Udoyen Peter Snr"],
    ["Forex capital", "Udoyen Peter Snr"],
    ["Options fundamentals", "Godaapp Instructor"],
  ])("maps %s to %s", (title, instructor) => {
    expect(getCourseInstructorName(title)).toBe(instructor);
  });
});

describe("Payload role checks", () => {
  it("requires an active admin for admin access", () => {
    expect(isActivePayloadAdmin({ role: "admin", isActive: true })).toBe(true);
    expect(isActivePayloadAdmin({ role: "admin", isActive: false })).toBe(false);
    expect(isActivePayloadAdmin({ role: "instructor", isActive: true })).toBe(false);
    expect(isActivePayloadAdmin(null)).toBe(false);
  });

  it("allows active admins and instructors to edit courses", () => {
    expect(isActiveCourseEditor({ role: "admin", isActive: true })).toBe(true);
    expect(isActiveCourseEditor({ role: "instructor", isActive: true })).toBe(true);
    expect(isActiveCourseEditor({ role: "student", isActive: true })).toBe(false);
    expect(isActiveCourseEditor({ role: "instructor", isActive: false })).toBe(false);
    expect(isActiveCourseEditor(undefined)).toBe(false);
  });
});

describe("student learning activity normalization", () => {
  it("returns empty activity for non-object input", () => {
    expect(getStudentLearningActivity(null)).toEqual({ lessons: {}, dailySeconds: {} });
    expect(getStudentLearningActivity("invalid")).toEqual({ lessons: {}, dailySeconds: {} });
  });

  it("keeps valid lessons and clamps watched seconds", () => {
    expect(
      getStudentLearningActivity({
        lessons: {
          "12": {
            courseId: 3,
            watchedSeconds: 8.9,
            lastWatchedAt: "2026-01-01T10:00:00.000Z",
            completedAt: "2026-01-01T10:01:00.000Z",
          },
          "0": { courseId: 3, watchedSeconds: 1, lastWatchedAt: "now" },
          invalid: { courseId: 3, watchedSeconds: 1, lastWatchedAt: "now" },
          "13": { courseId: 0, watchedSeconds: 1, lastWatchedAt: "now" },
          "14": { courseId: 3, watchedSeconds: Number.NaN, lastWatchedAt: "now" },
        },
      }),
    ).toEqual({
      lessons: {
        "12": {
          courseId: 3,
          watchedSeconds: 8,
          lastWatchedAt: "2026-01-01T10:00:00.000Z",
          completedAt: "2026-01-01T10:01:00.000Z",
        },
      },
      dailySeconds: {},
    });
  });

  it("validates day keys and clamps daily totals to one day", () => {
    expect(
      getStudentLearningActivity({
        dailySeconds: {
          "2026-02-03": 90_000.4,
          "2026-02-04": -4,
          "2026-2-04": 10,
          "2026-02-05": Number.POSITIVE_INFINITY,
        },
      }).dailySeconds,
    ).toEqual({
      "2026-02-03": 86_400,
      "2026-02-04": 0,
    });
  });
});

describe("class name merging", () => {
  it("combines conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("p-2", false && "hidden", "p-4", "text-sm")).toBe("p-4 text-sm");
  });
});
