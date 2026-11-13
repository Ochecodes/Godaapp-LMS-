"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateStudentProfile } from "@/app/(frontend)/(student)/dashboard/actions";

type StudentProfileSettingsProps = {
  email: string;
  emailVerified: boolean;
  publicEmail: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  location: string;
  about: string;
  team: string;
  company: string;
  pronouns: string;
  website: string;
};

const inputClass = "min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const pronounOptions = ["she/her", "he/him", "they/them", "ask me"];

export function StudentProfileSettings(props: StudentProfileSettingsProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(props.avatarUrl);
  const router = useRouter();
  const hasCustomPronouns = props.pronouns && !pronounOptions.includes(props.pronouns.toLowerCase());

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
      <section className="space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-semibold">Public profile</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(13rem,0.8fr)]">
          <div className="space-y-5">
            <label className="block space-y-1.5 text-sm font-medium">
              Name
              <input autoComplete="name" className={inputClass} defaultValue={props.fullName} maxLength={120} name="fullName" required />
              <span className="block text-xs font-normal text-muted-foreground">Your name may appear around GodaApp when you learn or participate in the community.</span>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Public email
              <select className={inputClass} defaultValue={props.publicEmail} name="publicEmail">
                <option value="">Don’t show an email</option>
                {props.emailVerified && props.email && <option value={props.email}>{props.email}</option>}
              </select>
              <span className="block text-xs font-normal text-muted-foreground">
                {props.emailVerified
                  ? "Only your verified account email can be selected. This preference does not make it public by itself."
                  : "Verify your account email before choosing to display it."}
              </span>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Bio
              <textarea className={`${inputClass} min-h-24 resize-y`} defaultValue={props.about} maxLength={1000} name="about" placeholder="Tell us a little about yourself" rows={3} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Pronouns
              <select className={inputClass} defaultValue={props.pronouns} name="pronouns">
                <option value="">Don’t specify</option>
                {hasCustomPronouns && <option value={props.pronouns}>{props.pronouns}</option>}
                {pronounOptions.map((pronouns) => (
                  <option key={pronouns} value={pronouns}>{pronouns}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              URL
              <input autoComplete="url" className={inputClass} defaultValue={props.website} maxLength={2048} name="website" placeholder="https://example.com" type="url" />
            </label>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Profile picture</h3>
            {avatarPreview ? (
              <Image
                alt="Current profile picture"
                className="size-36 rounded-full border border-border object-cover"
                height={144}
                src={avatarPreview}
                unoptimized
                width={144}
              />
            ) : (
              <span aria-label="No profile picture set" className="grid size-36 place-items-center rounded-full border border-border bg-muted text-4xl font-semibold text-muted-foreground" role="img">
                {props.fullName.trim().charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <label className="block space-y-1.5 text-sm font-medium">
              Picture URL
              <input className={inputClass} defaultValue={props.avatarUrl} maxLength={2048} name="avatarUrl" onChange={(event) => setAvatarPreview(event.target.value)} placeholder="https://…" type="url" />
              <span className="block text-xs font-normal text-muted-foreground">Enter a direct image URL. File uploads are not configured.</span>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h2 className="text-base font-semibold">Contact and account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Contact details help us keep your student account up to date.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            Account email
            <input autoComplete="email" className={`${inputClass} bg-muted text-muted-foreground`} readOnly value={props.email} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Phone number
            <input autoComplete="tel" className={inputClass} defaultValue={props.phone} maxLength={40} name="phone" type="tel" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Location
            <input autoComplete="address-level2" className={inputClass} defaultValue={props.location} maxLength={120} name="location" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Team
            <input className={inputClass} defaultValue={props.team} maxLength={120} name="team" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Company or organization
            <input autoComplete="organization" className={inputClass} defaultValue={props.company} maxLength={120} name="company" />
          </label>
        </div>
      </section>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {message && <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">{message}</p>}
      <button className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
