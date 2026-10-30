"use server";

import { getPayload } from "payload";
import { redirect } from "next/navigation";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { trackTinybirdEvent } from "@/lib/tinybird/client";
import { getAuthorizedStudentLesson } from "@/lib/student-lesson-access";
import { getStudentLearningActivity } from "@/lib/student-learning-activity";
import { normalizeStudentEmail } from "@/lib/student-email";

export type ProfileActionResult = { success?: string; error?: string };

export async function recordStudentLessonActivity(
  lessonId: number,
  watchedSeconds: number,
  completed: boolean,
): Promise<{ success?: true; error?: string }> {
  if (
    !Number.isInteger(lessonId) ||
    lessonId < 1 ||
    !Number.isInteger(watchedSeconds) ||
    watchedSeconds < 0 ||
    watchedSeconds > 30 ||
    typeof completed !== "boolean" ||
    (watchedSeconds === 0 && !completed)
  ) {
    return { error: "The lesson activity could not be recorded because its data was invalid." };
  }

  const access = await getAuthorizedStudentLesson(lessonId);
  if (!access) return { error: "You no longer have access to this lesson. Sign in or check your enrollment." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: "Your session could not be verified. Please sign in again." };
  if (!user) return { error: "Please sign in before recording lesson activity." };

  const currentActivity = getStudentLearningActivity(user.user_metadata?.student_learning);
  const now = new Date();
  const timestamp = now.toISOString();
  const day = timestamp.slice(0, 10);
  const existingLesson = currentActivity.lessons[String(lessonId)];

  currentActivity.lessons[String(lessonId)] = {
    courseId: access.course.id,
    watchedSeconds: (existingLesson?.watchedSeconds ?? 0) + watchedSeconds,
    lastWatchedAt: timestamp,
    ...((existingLesson?.completedAt || completed) ? { completedAt: existingLesson?.completedAt ?? timestamp } : {}),
  };
  currentActivity.dailySeconds[day] = Math.min(
    86_400,
    (currentActivity.dailySeconds[day] ?? 0) + watchedSeconds,
  );

  const activityDays = Object.keys(currentActivity.dailySeconds).sort();
  for (const oldDay of activityDays.slice(0, Math.max(0, activityDays.length - 365))) {
    delete currentActivity.dailySeconds[oldDay];
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { student_learning: currentActivity },
  });
  if (updateError) return { error: "Your lesson activity could not be saved. Please try again." };

  return { success: true };
}

export async function updateStudentProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: "Your session could not be verified. Please sign in again." };
  if (!user) return { error: "Please sign in before changing your profile." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();

  if (!fullName || fullName.length > 120) return { error: "Enter a name of 1–120 characters." };
  if (avatarUrl && (!/^https?:\/\//i.test(avatarUrl) || avatarUrl.length > 2048)) {
    return { error: "Profile picture must be a valid HTTP or HTTPS image URL." };
  }
  if (phone.length > 40 || location.length > 120 || about.length > 1000 || team.length > 120) {
    return { error: "One or more profile fields exceed their maximum length." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      avatar_url: avatarUrl || null,
      phone: phone || null,
      location: location || null,
      about: about || null,
      team: team || null,
    },
  });
  if (updateError) return { error: updateError.message };

  const payload = await getPayload({ config });
  const students = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  });
  if (!students.docs[0]) return { error: "Your student profile could not be found." };

  await payload.update({
    collection: "users",
    id: students.docs[0].id,
    data: { fullName, avatarUrl: avatarUrl || null },
    overrideAccess: true,
  });

  return { success: "Your profile has been updated." };
}

export async function signOutStudent() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  redirect("/sign-in");
}

export async function deleteStudentAccount(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: "Your session could not be verified. Please sign in again." };
  if (!user) return { error: "Please sign in before deleting your account." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Account deletion is not configured." };
  }

  const payload = await getPayload({ config });
  const student = await payload.find({
    collection: "users",
    where: { supabase_uid: { equals: user.id } },
    limit: 1,
    overrideAccess: true,
  });
  const studentId = student.docs[0]?.id;

  const enrollments = await payload.find({
    collection: "enrollments",
    where: { email: { equals: normalizeStudentEmail(user.email ?? "") } },
    limit: 1000,
    pagination: false,
    overrideAccess: true,
  });
  for (const enrollment of enrollments.docs) {
    await payload.delete({ collection: "enrollments", id: enrollment.id, overrideAccess: true });
  }
  if (studentId) {
    await payload.delete({ collection: "users", id: studentId, overrideAccess: true });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("[Account deletion] Supabase Auth user deletion failed after profile cleanup:", deleteError.message);
    return { error: "Profile data was removed, but authentication deletion failed. Contact support to finish account removal." };
  }

  try {
    const cookieStore = await cookies();
    await trackTinybirdEvent({
      event: "account_deleted",
      event_id: createHash("sha256").update(user.id).digest("hex"),
      visitor_id: cookieStore.get("goda_visitor_id")?.value,
    });
  } catch (error) {
    console.error("[Tinybird] Account-deletion ingestion failed:", error);
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("[Account deletion] Account was deleted but its browser session could not be cleared:", signOutError.message);
    return { error: "Your account was deleted, but the session could not be cleared. Close this browser tab and sign in again." };
  }
  return { success: "Your account has been deleted." };
}
