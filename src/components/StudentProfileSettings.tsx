"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateStudentProfile } from "@/app/(frontend)/(student)/dashboard/actions";

type StudentProfileSettingsProps = {
  fullName: string;
  avatarUrl: string;
  phone: string;
  location: string;
  about: string;
  team: string;
};

const inputClass = "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function StudentProfileSettings(props: StudentProfileSettingsProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const result = await updateStudentProfile(new FormData(event.currentTarget));
    if (result.error) setError(result.error);
    if (result.success) {
      setMessage(result.success);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Full name
          <input className={inputClass} defaultValue={props.fullName} maxLength={120} name="fullName" required />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Phone number
          <input autoComplete="tel" className={inputClass} defaultValue={props.phone} maxLength={40} name="phone" type="tel" />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Profile picture URL
          <input className={inputClass} defaultValue={props.avatarUrl} maxLength={2048} name="avatarUrl" placeholder="https://…" type="url" />
          <span className="block text-xs font-normal text-muted-foreground">
            Use a direct image URL. File uploads require an avatar storage bucket to be configured.
          </span>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Location
          <input autoComplete="address-level2" className={inputClass} defaultValue={props.location} maxLength={120} name="location" />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Team
          <input className={inputClass} defaultValue={props.team} maxLength={120} name="team" />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          About
          <textarea className={`${inputClass} min-h-28 resize-y`} defaultValue={props.about} maxLength={1000} name="about" rows={4} />
        </label>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {message && <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">{message}</p>}
      <button className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
