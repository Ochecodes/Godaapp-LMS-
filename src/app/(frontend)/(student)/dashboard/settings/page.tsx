"use client";

import { useDashboardIdentity } from "@/components/DashboardIdentity";
import { StudentProfileSettings } from "@/components/StudentProfileSettings";
import { ThemePreferenceControl } from "@/components/ThemePreferenceControl";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";

export default function StudentSettingsPage() {
  const { email, emailVerified, avatarUrl, fullName, profileMetadata } = useDashboardIdentity();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <DashboardPageBanner
        description="Manage the profile details and preferences associated with your student account."
        icon="lucide:settings-2"
        title="Settings"
      />
      <section className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-7">
        <StudentProfileSettings
          email={email}
          emailVerified={emailVerified}
          publicEmail={typeof profileMetadata.public_email === "string" ? profileMetadata.public_email : ""}
          about={typeof profileMetadata.about === "string" ? profileMetadata.about : ""}
          avatarUrl={avatarUrl ?? (typeof profileMetadata.avatar_url === "string" ? profileMetadata.avatar_url : "")}
          fullName={fullName}
          location={typeof profileMetadata.location === "string" ? profileMetadata.location : ""}
          phone={typeof profileMetadata.phone === "string" ? profileMetadata.phone : ""}
          team={typeof profileMetadata.team === "string" ? profileMetadata.team : ""}
          company={typeof profileMetadata.company === "string" ? profileMetadata.company : ""}
          pronouns={typeof profileMetadata.pronouns === "string" ? profileMetadata.pronouns : ""}
          website={typeof profileMetadata.website === "string" ? profileMetadata.website : ""}
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