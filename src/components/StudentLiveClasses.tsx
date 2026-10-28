"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Video,
} from "lucide-react";

export type StudentLiveClass = {
  id: string;
  courseTitle: string;
  title: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
};

type StudentLiveClassesProps = {
  classes: StudentLiveClass[];
};

export function StudentLiveClasses({ classes }: StudentLiveClassesProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const selectedClass = classes.find((liveClass) => liveClass.id === selectedClassId);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {selectedClass ? (
          <LiveClassRoom
            liveClass={selectedClass}
            now={now}
            onClose={() => setSelectedClassId(null)}
          />
        ) : (
          <>
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Video aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Live classes</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Google Meet sessions for courses you are enrolled in.
                </p>
              </div>
            </div>

            {classes.length ? (
              <ul className="mt-7 space-y-3">
                {classes.map((liveClass) => {
                  const status = getStatus(liveClass, now);
                  const ended = status === "ended";
                  return (
                    <li key={liveClass.id}>
                      <button
                        aria-label={`${liveClass.title}, ${status === "live" ? "ongoing" : status === "upcoming" ? "upcoming" : "ended"}`}
                        className={`w-full rounded-xl border border-border bg-card p-4 text-left transition-colors sm:p-5 ${
                          ended
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        }`}
                        disabled={ended}
                        onClick={() => setSelectedClassId(liveClass.id)}
                        type="button"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">{liveClass.courseTitle}</p>
                            <h2 className="mt-1 truncate text-base font-semibold">{liveClass.title}</h2>
                          </div>
                          <StatusBadge status={status} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays aria-hidden="true" className="size-4" />
                            {formatDate(liveClass.startsAt)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 aria-hidden="true" className="size-4" />
                            {formatTime(liveClass.startsAt)}–{formatTime(liveClass.endsAt)}
                            <span aria-hidden="true">·</span>
                            {formatDuration(liveClass.startsAt, liveClass.endsAt)}
                          </span>
                        </div>
                        {ended && (
                          <p className="mt-3 text-xs font-medium text-muted-foreground">
                            This class has ended. The meeting link is no longer available.
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                <Video aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-3 text-lg font-semibold">No live classes scheduled</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  When an instructor schedules a class for one of your courses, it will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function LiveClassRoom({
  liveClass,
  now,
  onClose,
}: {
  liveClass: StudentLiveClass;
  now: number;
  onClose: () => void;
}) {
  const status = getStatus(liveClass, now);
  const upcoming = status === "upcoming";
  const ended = status === "ended";

  return (
    <section>
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onClose}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to live classes
      </button>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{liveClass.courseTitle}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{liveClass.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(liveClass.startsAt)} · {formatTime(liveClass.startsAt)}–{formatTime(liveClass.endsAt)} ·{" "}
            {formatDuration(liveClass.startsAt, liveClass.endsAt)}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {upcoming ? (
        <div className="mt-6 rounded-xl border border-border bg-card px-5 py-8 text-center">
          <CalendarDays aria-hidden="true" className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">This class has not started yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            It is scheduled to begin {formatDateTime(liveClass.startsAt)}. Return here when it starts to join.
          </p>
        </div>
      ) : ended ? (
        <div className="mt-6 rounded-xl border border-border bg-card px-5 py-8 text-center">
          <h2 className="text-lg font-semibold">This class has ended</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The meeting link is disabled. Return to see other scheduled classes.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <iframe
              allow="camera; microphone; fullscreen; display-capture"
              allowFullScreen
              className="h-[min(70vh,42rem)] min-h-[24rem] w-full bg-muted"
              referrerPolicy="strict-origin-when-cross-origin"
              src={liveClass.meetingUrl}
              title={`Google Meet: ${liveClass.title}`}
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-muted-foreground">
              Google Meet controls sign-in, admission, camera, and microphone access. If Meet does not load here,
              open it directly.
            </p>
            <a
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={liveClass.meetingUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open Google Meet
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </div>
        </>
      )}
    </section>
  );
}

function getStatus(liveClass: StudentLiveClass, now: number): "upcoming" | "live" | "ended" {
  if (now < Date.parse(liveClass.startsAt)) return "upcoming";
  if (now >= Date.parse(liveClass.endsAt)) return "ended";
  return "live";
}

function StatusBadge({ status }: { status: "upcoming" | "live" | "ended" }) {
  const label = status === "live" ? "In progress" : status === "upcoming" ? "Upcoming" : "Ended";
  const className =
    status === "live"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "upcoming"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDuration(startsAt: string, endsAt: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(endsAt) - Date.parse(startsAt)) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}
