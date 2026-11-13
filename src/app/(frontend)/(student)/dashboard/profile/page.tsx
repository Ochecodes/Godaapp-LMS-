"use client";

import { useDashboardIdentity } from "@/components/DashboardIdentity";
import type { DashboardProfileMetadata } from "@/components/DashboardIdentity";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";
import Image from "next/image";

function getMetadataValue(metadata: DashboardProfileMetadata, key: keyof DashboardProfileMetadata) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
}

function getSafeWebsite(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function StudentProfilePage() {
  const { fullName, email, createdAt, emailVerified, profileMetadata: metadata } = useDashboardIdentity();
  const website = getSafeWebsite(metadata.website);
  const publicEmail =
    emailVerified && typeof metadata.public_email === "string" &&
    metadata.public_email.toLowerCase() === email.toLowerCase()
      ? email
      : null;
  const profileFields = [
    { label: "Public email", value: publicEmail ?? "Not displayed", icon: "lucide:mail" },
    { label: "Phone number", value: getMetadataValue(metadata, "phone"), icon: "lucide:phone" },
    { label: "Location", value: getMetadataValue(metadata, "location"), icon: "lucide:map-pin" },
    { label: "Team", value: getMetadataValue(metadata, "team"), icon: "lucide:users-round" },
    { label: "Company or organization", value: getMetadataValue(metadata, "company"), icon: "lucide:building-2" },
    { label: "Pronouns", value: getMetadataValue(metadata, "pronouns"), icon: "lucide:user-round" },
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
            <Image
              alt=""
              className="size-20 rounded-full border-4 border-background object-cover shadow-sm"
              height={80}
              src={metadata.avatar_url}
              unoptimized
              width={80}
            />
          ) : (
            <span aria-hidden="true" className="grid size-20 place-items-center rounded-full border-4 border-background bg-[#068365]/10 text-2xl font-semibold text-[#068365] shadow-sm">
              {fullName === "Not provided" ? "S" : fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#068365]">Student account</p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight">{fullName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Member since {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(createdAt))}</p>
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
          <div className="bg-card p-5 sm:col-span-2 sm:p-6">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DashboardIcon aria-hidden="true" className="size-4 text-[#068365]" icon="lucide:link" />
              Website
            </dt>
            {website ? (
              <dd className="mt-2 break-all text-sm font-semibold">
                <a className="text-primary underline-offset-4 hover:underline" href={website} rel="noreferrer" target="_blank">
                  {website}
                </a>
              </dd>
            ) : (
              <dd className="mt-2 text-sm font-semibold">Not provided</dd>
            )}
          </div>
        </dl>
      </section>
    </main>
  );
}
