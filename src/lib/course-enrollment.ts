import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Payload } from "payload";
import type { Course, User } from "../../payload-types";

export async function ensurePayloadStudent(payload: Payload, authUser: SupabaseUser): Promise<User> {
  if (!authUser.email) throw new Error("Your account needs a verified email address.");

  const existing = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: authUser.id } },
    limit: 1,
    overrideAccess: true,
  });
  const metadata = authUser.user_metadata ?? {};
  const fullName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    authUser.email.split("@")[0];
  const avatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : Object.hasOwn(metadata, "avatar_url")
        ? null
        : typeof metadata.picture === "string"
          ? metadata.picture
          : null;

  if (existing.docs[0]) {
    return payload.update({
      collection: "users",
      id: existing.docs[0].id,
      data: {
        email: authUser.email,
        fullName,
        avatarUrl,
      },
      overrideAccess: true,
    });
  }

  const emailMatch = await payload.find({
    collection: "users",
    where: { email: { equals: authUser.email } },
    limit: 1,
    overrideAccess: true,
  });
  if (emailMatch.docs.length) {
    throw new Error("This email is already linked to a different student profile. Contact support.");
  }

  return payload.create({
    collection: "users",
    data: {
      email: authUser.email,
      supabase_uid: authUser.id,
      fullName,
      role: "student",
      ...(avatarUrl ? { avatarUrl } : {}),
      isActive: true,
    },
    overrideAccess: true,
  });
}

export async function ensureCourseEnrollment(
  payload: Payload,
  authUser: SupabaseUser,
  course: Course,
): Promise<void> {
  if (!authUser.email) throw new Error("Your account needs a verified email address.");

  const student = await ensurePayloadStudent(payload, authUser);
  const existingEnrollments = await payload.find({
    collection: "enrollments",
    where: { course: { equals: course.id } },
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  });
  const existing = existingEnrollments.docs.find(
    (enrollment) => enrollment.email.trim().toLowerCase() === authUser.email!.trim().toLowerCase(),
  );

  if (existing?.isActive) return;
  if (existing) {
    await payload.update({
      collection: "enrollments",
      id: existing.id,
      data: { email: authUser.email, user: student.id, isActive: true },
      overrideAccess: true,
    });
    return;
  }

  await payload.create({
    collection: "enrollments",
    data: {
      email: authUser.email,
      user: student.id,
      course: course.id,
      isActive: true,
    },
    overrideAccess: true,
  });
}

export async function findPublishedCourseBySlug(payload: Payload, slug: string): Promise<Course | null> {
  const result = await payload.find({
    collection: "courses",
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}
