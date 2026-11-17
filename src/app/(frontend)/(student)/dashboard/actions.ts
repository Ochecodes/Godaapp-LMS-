"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { trackTinybirdEvent } from "@/lib/tinybird/client";
import { getAuthorizedStudentLesson } from "@/lib/student-lesson-access";
import { getStudentLearningActivity } from "@/lib/student-learning-activity";
import { normalizeStudentEmail } from "@/lib/student-email";

export type ProfileActionResult = {
  success?: string;
  error?: string;
  logoutUserId?: string;
};

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
  if (authError) {
    console.error("[Student activity] Session verification failed:", authError);
    return { error: "Your session could not be verified. Please sign in again." };
  }
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
  if (updateError) {
    console.error("[Student activity] Learning progress update failed:", updateError);
    return { error: "Your lesson activity could not be saved. Please try again." };
  }

  return { success: true };
}

export async function updateStudentProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Student profile] Session verification failed:", authError);
    return { error: "Your session could not be verified. Please sign in again." };
  }
  if (!user) return { error: "Please sign in before changing your profile." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const pronouns = String(formData.get("pronouns") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const publicEmail = String(formData.get("publicEmail") ?? "").trim();

  if (!fullName || fullName.length > 120) return { error: "Enter a name of 1–120 characters." };
  if (publicEmail && (!user.email_confirmed_at || publicEmail.toLowerCase() !== user.email?.toLowerCase())) {
    return { error: "Choose your verified account email or select not to display an email." };
  }
  if (avatarUrl && !isHttpUrl(avatarUrl)) {
    return { error: "Profile picture must be a valid HTTP or HTTPS image URL." };
  }
  if (website && !isHttpUrl(website)) {
    return { error: "Website must be a valid HTTP or HTTPS URL." };
  }
  if (
    phone.length > 40 ||
    location.length > 120 ||
    about.length > 1000 ||
    team.length > 120 ||
    company.length > 120 ||
    pronouns.length > 40 ||
    website.length > 2048
  ) {
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
      company: company || null,
      pronouns: pronouns || null,
      website: website || null,
      public_email: publicEmail || null,
    },
  });
  if (updateError) {
    console.error("[Student profile] Supabase profile update failed:", updateError);
    return { error: "Your profile could not be updated. Please try again." };
  }

  try {
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
  } catch (error) {
    console.error("[Student profile] Payload profile update failed:", error);
    return { error: "Your profile could not be updated. Please try again." };
  }

  return { success: "Your profile has been updated." };
}

function isHttpUrl(value: string) {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function signOutStudent() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("[Auth] Student session lookup before sign out failed:", userError);
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Auth] Student sign out failed:", error);
      return { error: "You could not be signed out. Please try again." };
    }
    return { success: true, userId: userError ? null : user?.id ?? null };
  } catch (error) {
    console.error("[Auth] Student sign out failed:", error);
    return { error: "You could not be signed out. Please try again." };
  }
}

export async function deleteStudentAccount(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[Account deletion] Session verification failed:", authError);
    return { error: "Your session could not be verified. Please sign in again." };
  }
  if (!user) return { error: "Please sign in before deleting your account." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[Account deletion] Admin client could not be configured:", error);
    return { error: "Account deletion is temporarily unavailable. Please try again later." };
  }

  try {
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
  } catch (error) {
    console.error("[Account deletion] Payload cleanup failed:", error);
    return { error: "Account deletion could not be completed. Please contact support." };
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
  return { success: "Your account has been deleted.", logoutUserId: user.id };
}
