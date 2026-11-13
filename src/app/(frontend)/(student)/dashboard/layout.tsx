import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@/payload.config";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensurePayloadStudent } from "@/lib/course-enrollment";
import { DashboardShell } from "@/components/DashboardShell";
import StudentDashboardLoading from "./loading";

export const preferredRegion = "fra1";

// Keep the per-user active-status cache short so admin deactivations take effect promptly.
const getDashboardStudent = unstable_cache(
  async (
    userId: string,
    email: string | null,
    metadata: {
      full_name?: unknown;
      name?: unknown;
      avatar_url?: unknown;
      picture?: unknown;
    },
  ) => {
    const startedAt = performance.now();
    const payload = await getPayload({ config });
    const payloadInitializationMs = performance.now() - startedAt;
    const syncStartedAt = performance.now();
    const student = await ensurePayloadStudent(payload, {
      id: userId,
      email,
      user_metadata: metadata,
    });
    const studentSyncMs = performance.now() - syncStartedAt;
    const elapsedMs = performance.now() - startedAt;
    if (elapsedMs > 1000) {
      console.warn("[Dashboard] Payload student lookup was slow.", {
        payloadInitializationMs: Math.round(payloadInitializationMs),
        studentSyncMs: Math.round(studentSyncMs),
        elapsedMs: Math.round(elapsedMs),
      });
    }
    return student;
  },
  ["dashboard-payload-student-v1"],
  { revalidate: 60 },
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StudentDashboardLoading />}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </Suspense>
  );
}

async function AuthenticatedDashboardLayout({ children }: { children: ReactNode }) {
  const startedAt = performance.now();
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");
  const authMs = performance.now() - startedAt;

  const studentStartedAt = performance.now();
  const student = await getDashboardStudent(user.id, user.email ?? null, {
    full_name: user.user_metadata?.full_name,
    name: user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url,
    picture: user.user_metadata?.picture,
  });
  if (!student.isActive) redirect("/sign-in?error=account-disabled");
  const studentSyncMs = performance.now() - studentStartedAt;
  const elapsedMs = performance.now() - startedAt;
  if (elapsedMs > 1000) {
    console.warn("[Dashboard] Shared layout dependencies were slow.", {
      authMs: Math.round(authMs),
      studentSyncMs: Math.round(studentSyncMs),
      elapsedMs: Math.round(elapsedMs),
    });
  }

  return (
    <DashboardShell
      avatarUrl={student.avatarUrl ?? undefined}
      createdAt={student.createdAt}
      emailVerified={user.email_verified}
      fullName={student.fullName}
      email={student.email}
      profileMetadata={{
        public_email: user.user_metadata?.public_email,
        about: user.user_metadata?.about,
        avatar_url: user.user_metadata?.avatar_url,
        location: user.user_metadata?.location,
        phone: user.user_metadata?.phone,
        team: user.user_metadata?.team,
        company: user.user_metadata?.company,
        pronouns: user.user_metadata?.pronouns,
        website: user.user_metadata?.website,
      }}
    >
      {children}
    </DashboardShell>
  );
}
