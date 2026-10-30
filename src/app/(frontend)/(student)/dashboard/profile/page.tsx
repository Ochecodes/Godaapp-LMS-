import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";

function getMetadataValue(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
}

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const metadata = user.user_metadata ?? {};
  const fullName = getMetadataValue(metadata, "full_name");
  const profileFields = [
    { label: "Email address", value: user.email ?? "Not provided", icon: "lucide:mail" },
    { label: "Phone number", value: getMetadataValue(metadata, "phone"), icon: "lucide:phone" },
    { label: "Location", value: getMetadataValue(metadata, "location"), icon: "lucide:map-pin" },
    { label: "Team", value: getMetadataValue(metadata, "team"), icon: "lucide:users-round" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="Your student profile and account details."
        icon="lucide:user-round"
        title="Profile"
      />
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:p-7">
          {typeof metadata.avatar_url === "string" && metadata.avatar_url ? (
            <img alt="" className="size-20 rounded-full border-4 border-background object-cover shadow-sm" src={metadata.avatar_url} />
          ) : (
            <span aria-hidden="true" className="grid size-20 place-items-center rounded-full border-4 border-background bg-[#068365]/10 text-2xl font-semibold text-[#068365] shadow-sm">
              {fullName === "Not provided" ? "S" : fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#068365]">Student account</p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight">{fullName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Member since {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(user.created_at))}</p>
          </div>
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/dashboard/settings">
            <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:settings-2" />
            Edit profile
          </a>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-2">
          {profileFields.map((field) => (
            <div className="bg-card p-5 sm:p-6" key={field.label}>
              <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DashboardIcon aria-hidden="true" className="size-4 text-[#068365]" icon={field.icon} />
                {field.label}
              </dt>
              <dd className="mt-2 break-words text-sm font-semibold">{field.value}</dd>
            </div>
          ))}
          <div className="bg-card p-5 sm:col-span-2 sm:p-6">
            <dt className="text-sm font-medium text-muted-foreground">About</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {getMetadataValue(metadata, "about")}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
