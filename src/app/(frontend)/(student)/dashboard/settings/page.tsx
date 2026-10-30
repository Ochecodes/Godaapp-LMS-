import { getPayload } from "payload";
import config from "@/payload.config";
import { createClient } from "@/lib/supabase/server";
import { StudentProfileSettings } from "@/components/StudentProfileSettings";
import { ThemePreferenceControl } from "@/components/ThemePreferenceControl";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const metadata = user?.user_metadata ?? {};
  const payload = await getPayload({ config });
  const result = user
    ? await payload.find({
        collection: "users",
        where: { supabase_uid: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      })
    : { docs: [] };
  const student = result.docs[0];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <DashboardPageBanner
        description="Manage the profile details and preferences associated with your student account."
        icon="lucide:settings-2"
        title="Settings"
      />
      <section className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-7">
        <StudentProfileSettings
          about={typeof metadata.about === "string" ? metadata.about : ""}
          avatarUrl={student?.avatarUrl ?? (typeof metadata.avatar_url === "string" ? metadata.avatar_url : "")}
          fullName={student?.fullName ?? (typeof metadata.full_name === "string" ? metadata.full_name : "")}
          location={typeof metadata.location === "string" ? metadata.location : ""}
          phone={typeof metadata.phone === "string" ? metadata.phone : ""}
          team={typeof metadata.team === "string" ? metadata.team : ""}
        />
      </section>

      <ThemePreferenceControl />

      <section className="mt-6 rounded-xl border border-destructive/30 bg-card p-5 sm:p-7">
        <h2 className="font-semibold text-destructive">Delete account</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Permanently delete your GodaApp sign-in, profile, and course enrollments. This action cannot be undone.
        </p>
        <a className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-destructive/50 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10" href="/dashboard/delete-account">
          Review account deletion
        </a>
      </section>
    </main>
  );
}