import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import type { Course, User } from "../../payload-types";
import {
  ensureCourseEnrollment,
  ensurePayloadStudent,
  findPublishedCourseBySlug,
  type StudentAuthUser,
} from "@/lib/course-enrollment";

function makePayload() {
  return {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as Payload & {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

const authUser: StudentAuthUser = {
  id: "supabase-user-1",
  email: "student@example.com",
  user_metadata: { full_name: "Student Example", picture: "https://images.example/student.png" },
};

const student = {
  id: 8,
  email: authUser.email,
  supabase_uid: authUser.id,
  fullName: "Student Example",
  avatarUrl: "https://images.example/student.png",
} as User;

const course = { id: 4, slug: "investing-basics" } as Course;

describe("ensurePayloadStudent", () => {
  let payload: ReturnType<typeof makePayload>;

  beforeEach(() => {
    payload = makePayload();
  });

  it("requires a verified email before reading or writing a student", async () => {
    await expect(
      ensurePayloadStudent(payload, { ...authUser, email: null }),
    ).rejects.toThrow("verified email");
    expect(payload.find).not.toHaveBeenCalled();
  });

  it("returns an existing unchanged student without writing", async () => {
    payload.find.mockResolvedValue({ docs: [student] });

    await expect(ensurePayloadStudent(payload, authUser)).resolves.toBe(student);
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.create).not.toHaveBeenCalled();
  });

  it("synchronizes changed name, email, and avatar metadata", async () => {
    payload.find.mockResolvedValue({ docs: [{ ...student, fullName: "Old Name" }] });
    payload.update.mockResolvedValue(student);

    await ensurePayloadStudent(payload, {
      ...authUser,
      email: "new@example.com",
      user_metadata: { name: "New Name", avatar_url: null, picture: "ignored" },
    });

    expect(payload.update).toHaveBeenCalledWith({
      collection: "users",
      id: student.id,
      data: { email: "new@example.com", fullName: "New Name", avatarUrl: null },
      overrideAccess: true,
    });
  });

  it("creates a student when no Supabase ID or email match exists", async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });
    payload.create.mockResolvedValue(student);

    await ensurePayloadStudent(payload, authUser);

    expect(payload.create).toHaveBeenCalledWith({
      collection: "users",
      data: {
        email: authUser.email,
        supabase_uid: authUser.id,
        fullName: "Student Example",
        role: "student",
        avatarUrl: "https://images.example/student.png",
        isActive: true,
      },
      overrideAccess: true,
    });
  });

  it("uses email prefix as fallback name and blocks a conflicting profile", async () => {
    payload.find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [student] });

    await expect(
      ensurePayloadStudent(payload, {
        id: "different-auth-user",
        email: "student@example.com",
        user_metadata: {},
      }),
    ).rejects.toThrow("already linked to a different student profile");
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe("ensureCourseEnrollment", () => {
  let payload: ReturnType<typeof makePayload>;

  beforeEach(() => {
    payload = makePayload();
    payload.find.mockResolvedValue({ docs: [student] });
  });

  it("does not create another active enrollment", async () => {
    payload.find.mockResolvedValueOnce({ docs: [student] }).mockResolvedValueOnce({
      docs: [{ id: 21, isActive: true }],
    });

    await ensureCourseEnrollment(payload, authUser, course);

    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("reactivates an inactive enrollment with normalized email", async () => {
    const mixedCaseStudent = { ...student, email: " Student@Example.com " };
    payload.find
      .mockResolvedValueOnce({ docs: [mixedCaseStudent] })
      .mockResolvedValueOnce({ docs: [{ id: 21, isActive: false }] });
    payload.update.mockResolvedValue({ id: 21 });

    await ensureCourseEnrollment(
      payload,
      { ...authUser, email: " Student@Example.com " },
      course,
    );

    expect(payload.update).toHaveBeenCalledWith({
      collection: "enrollments",
      id: 21,
      data: { email: "student@example.com", user: student.id, isActive: true },
      overrideAccess: true,
    });
  });

  it("creates an active enrollment when none exists", async () => {
    payload.find.mockResolvedValueOnce({ docs: [student] }).mockResolvedValueOnce({ docs: [] });

    await ensureCourseEnrollment(payload, authUser, course);

    expect(payload.create).toHaveBeenCalledWith({
      collection: "enrollments",
      data: {
        email: authUser.email,
        user: student.id,
        course: course.id,
        isActive: true,
      },
      overrideAccess: true,
    });
  });
});

describe("findPublishedCourseBySlug", () => {
  it("returns only a published course matching the slug", async () => {
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [course] });

    await expect(findPublishedCourseBySlug(payload, course.slug)).resolves.toBe(course);
    expect(payload.find).toHaveBeenCalledWith({
      collection: "courses",
      where: {
        and: [
          { slug: { equals: course.slug } },
          { status: { equals: "published" } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
  });

  it("returns null when the course is not found", async () => {
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [] });
    await expect(findPublishedCourseBySlug(payload, "missing")).resolves.toBeNull();
  });
});
