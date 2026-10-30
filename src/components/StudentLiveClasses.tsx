"use client";

import { useEffect, useState } from "react";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { DashboardIcon } from "@/components/DashboardIcon";

export type StudentLiveClass = {
  id: string;
  courseTitle: string;
  title: string;
  instructorName: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
};

type StudentLiveClassesProps = {
  classes: StudentLiveClass[];
  scheduleKey: string;
};

export function StudentLiveClasses({ classes, scheduleKey }: StudentLiveClassesProps) {
  const [now, setNow] = useState(0);
  const [scheduledIds, setScheduledIds] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState("");
  const selectedClass = classes.find((liveClass) => liveClass.id === selectedClassId);
  const storageKey = `godaapp-scheduled-classes-${scheduleKey}`;

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 30_000);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setScheduledIds(parsed);
        }
      }
    } catch (error) {
      console.error("Could not read the saved live-class schedule:", error);
    }
    return () => window.clearInterval(interval);
  }, [storageKey]);

  useEffect(() => {
    if (!selectedClassId) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedClassId(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedClassId]);

  function scheduleClass(liveClass: StudentLiveClass) {
    const next = [...new Set([...scheduledIds, liveClass.id])];
    setScheduledIds(next);
    setScheduleError("");
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error("Could not save this live class to the browser:", error);
      setScheduleError("This class is marked as scheduled for this visit, but your browser could not save the reminder.");
    }
    setSelectedClassId(liveClass.id);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <DashboardPageBanner
        description="Review your upcoming course sessions and save the ones you plan to attend."
        icon="lucide:calendar-days"
        title="Live Classes"
      />
      {classes.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-muted/50">
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Instructor</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Time</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classes.map((liveClass) => {
                  const status = getStatus(liveClass, now);
                  const ended = status === "ended";
                  const scheduled = scheduledIds.includes(liveClass.id);
                  return (
                    <tr className="transition-colors hover:bg-muted/30" key={liveClass.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{liveClass.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{liveClass.courseTitle}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{liveClass.instructorName}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm">{formatDate(liveClass.startsAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                        {formatTime(liveClass.startsAt)}–{formatTime(liveClass.endsAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${scheduled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-[#068365] text-white hover:bg-[#056d53]"}`}
                            disabled={ended}
                            onClick={() => scheduled ? setSelectedClassId(liveClass.id) : scheduleClass(liveClass)}
                            type="button"
                          >
                            {scheduled ? <><DashboardIcon aria-hidden="true" className="size-3.5" icon="lucide:check" />Scheduled</> : ended ? "Ended" : "Join"}
                          </button>
                          {status === "live" && scheduled && (
                            <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={liveClass.meetingUrl} rel="noopener noreferrer" target="_blank">
                              Join now <DashboardIcon aria-hidden="true" className="size-3.5" icon="lucide:external-link" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Times are shown in your device’s local time zone.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <DashboardIcon aria-hidden="true" className="mx-auto size-9 text-muted-foreground" icon="lucide:calendar-clock" />
          <h2 className="mt-3 text-lg font-semibold">No live classes scheduled</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            When an instructor schedules a class for one of your enrolled courses, it will appear here.
          </p>
        </div>
      )}

      {selectedClass && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 p-4" onClick={() => setSelectedClassId(null)}>
          <section
            aria-labelledby="scheduled-class-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <DashboardIcon aria-hidden="true" className="size-7" icon="lucide:calendar-check-2" />
            </span>
            <h2 className="mt-4 text-xl font-semibold" id="scheduled-class-title">You’re scheduled!</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {selectedClass.title} with {selectedClass.instructorName} is on your schedule for {formatDateTime(selectedClass.startsAt)}.
            </p>
            {scheduleError && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-left text-xs text-destructive" role="alert">{scheduleError}</p>}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#068365] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#056d53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => downloadCalendarEvent(selectedClass)}
                type="button"
              >
                <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:calendar-plus-2" />
                Add to calendar
              </button>
              <button
                className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedClassId(null)}
                type="button"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function getStatus(liveClass: StudentLiveClass, now: number): "upcoming" | "live" | "ended" {
  if (now < Date.parse(liveClass.startsAt)) return "upcoming";
  if (now >= Date.parse(liveClass.endsAt)) return "ended";
  return "live";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function toCalendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function downloadCalendarEvent(liveClass: StudentLiveClass) {
  const event = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GodaApp//Student Dashboard//EN",
    "BEGIN:VEVENT",
    `UID:${encodeURIComponent(liveClass.id)}@godaapp`,
    `DTSTAMP:${toCalendarDate(new Date().toISOString())}`,
    `DTSTART:${toCalendarDate(liveClass.startsAt)}`,
    `DTEND:${toCalendarDate(liveClass.endsAt)}`,
    `SUMMARY:${escapeCalendarText(liveClass.title)}`,
    `DESCRIPTION:${escapeCalendarText(`${liveClass.courseTitle} with ${liveClass.instructorName}`)}`,
    `URL:${liveClass.meetingUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([event], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${liveClass.title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "godaapp-class"}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
