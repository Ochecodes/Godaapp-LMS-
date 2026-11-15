"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Check,
  ChevronDown,
  Clock,
  LockKeyhole,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { DashboardIcon } from "@/components/DashboardIcon";
import { DashboardPageBanner } from "@/components/DashboardPageBanner";
import { recordStudentLessonActivity } from "@/app/(frontend)/(student)/dashboard/actions";
import type {
  StudentLessonOutlineItem,
  StudentLessonOutlineModule,
} from "@/lib/student-lesson-access";

type QuizOption = {
  id: "A" | "B" | "C";
  text: string;
};

type StudentQuestion = {
  index: number;
  question: string;
  options: QuizOption[];
};

type QuizFeedback = {
  correct: boolean;
  correctOption?: QuizOption["id"];
  correctAnswer?: string;
};

type LessonPlayerProps = {
  lessonId: number;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  videoId: string;
  lessonOutline: StudentLessonOutlineModule[];
  previousLesson: StudentLessonOutlineItem | null;
  nextLesson: StudentLessonOutlineItem | null;
  completedLessonCount: number;
  totalLessonCount: number;
  initiallyCompleted: boolean;
  children: ReactNode;
};

type YouTubePlayerEvent = {
  data: number;
};

type YouTubePlayerErrorEvent = {
  data: number;
};

type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getIframe: () => HTMLIFrameElement;
  pauseVideo: () => void;
  playVideo: () => void;
  destroy: () => void;
};

type YouTubeAPI = {
  Player?: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: { rel: number; playsinline: number; origin: string };
      events: {
        onReady: () => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
        onError: (event: YouTubePlayerErrorEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { PLAYING: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeAPI;
  }
}

const QUIZ_INTERVAL_SECONDS = 120;

function getYouTubePlayerErrorMessage(errorCode: number) {
  switch (errorCode) {
    case 2:
      return "This lesson has an invalid YouTube video ID.";
    case 5:
      return "YouTube could not play this video in the current browser.";
    case 100:
      return "This YouTube video is unavailable or has been removed.";
    case 101:
    case 150:
      return "The video owner has disabled playback on other websites.";
    case 153:
      return "YouTube could not verify the video embed origin. Refresh the page and try again.";
    default:
      return "YouTube could not play this lesson. Refresh the page or contact support.";
  }
}

function formatLessonDuration(durationSeconds?: number | null) {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return "Duration not set";
  }

  const totalSeconds = Math.floor(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LessonPlayer({
  lessonId,
  lessonTitle,
  moduleTitle,
  courseTitle,
  videoId,
  lessonOutline,
  previousLesson,
  nextLesson,
  completedLessonCount,
  totalLessonCount,
  initiallyCompleted,
  children,
}: LessonPlayerProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const nextPromptAtRef = useRef(QUIZ_INTERVAL_SECONDS);
  const nextQuestionIndexRef = useRef(0);
  const requestInProgressRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const lastTrackedVideoTimeRef = useRef<number | null>(null);
  const activitySaveInProgressRef = useRef(false);
  const pendingActivityRef = useRef({ watchedSeconds: 0, completed: false });
  const [activitySaveError, setActivitySaveError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState<StudentQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuizOption["id"] | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [quizExhausted, setQuizExhausted] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(initiallyCompleted);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);

  const saveLessonActivity = useCallback(async (watchedSeconds = 0, completed = false) => {
    pendingActivityRef.current.watchedSeconds += watchedSeconds;
    pendingActivityRef.current.completed ||= completed;
    if (activitySaveInProgressRef.current || (!pendingActivityRef.current.watchedSeconds && !pendingActivityRef.current.completed)) return;
    activitySaveInProgressRef.current = true;
    let activeBatch: { watchedSeconds: number; completed: boolean } | null = null;
    try {
      while (pendingActivityRef.current.watchedSeconds || pendingActivityRef.current.completed) {
        const batch = pendingActivityRef.current;
        activeBatch = batch;
        pendingActivityRef.current = { watchedSeconds: 0, completed: false };
        const result = await recordStudentLessonActivity(lessonId, batch.watchedSeconds, batch.completed);
        if (result.error) {
          pendingActivityRef.current.watchedSeconds += batch.watchedSeconds;
          pendingActivityRef.current.completed ||= batch.completed;
          activeBatch = null;
          setActivitySaveError(result.error);
          return;
        }
        activeBatch = null;
        if (batch.completed) setIsLessonCompleted(true);
        setActivitySaveError("");
      }
    } catch {
      if (activeBatch) {
        pendingActivityRef.current.watchedSeconds += activeBatch.watchedSeconds;
        pendingActivityRef.current.completed ||= activeBatch.completed;
      }
      setActivitySaveError("Your lesson activity could not be saved. Please try again.");
    } finally {
      activitySaveInProgressRef.current = false;
    }
  }, [lessonId]);

  const initializePlayer = useCallback(() => {
    if (playerRef.current) return true;
    const api = window.YT;
    if (!playerContainerRef.current || typeof api?.Player !== "function") return false;

    playerRef.current = new api.Player(playerContainerRef.current, {
      videoId,
      playerVars: { rel: 0, playsinline: 1, origin: window.location.origin },
      events: {
        onReady: () => {
          const iframe = playerRef.current?.getIframe();
          if (iframe) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
          }
          setPlayerError(null);
        },
        onStateChange: (event) => {
          const api = window.YT;
          const player = playerRef.current;
          if (api && player && event.data === api.PlayerState.PLAYING) {
            lastTrackedVideoTimeRef.current = player?.getCurrentTime() ?? null;
          } else if (api && player && event.data === api.PlayerState.ENDED) {
            const previousTime = lastTrackedVideoTimeRef.current;
            const watchedSeconds = previousTime === null
              ? 0
              : Math.min(30, Math.max(0, Math.floor(player.getCurrentTime() - previousTime)));
            lastTrackedVideoTimeRef.current = null;
            void saveLessonActivity(watchedSeconds, true);
          } else if (player) {
            const previousTime = lastTrackedVideoTimeRef.current;
            const watchedSeconds = previousTime === null
              ? 0
              : Math.min(30, Math.max(0, Math.floor(player.getCurrentTime() - previousTime)));
            lastTrackedVideoTimeRef.current = null;
            if (watchedSeconds > 0) void saveLessonActivity(watchedSeconds, false);
          }
          setIsPlaying(event.data === api?.PlayerState.PLAYING);
        },
        onError: (event) => {
          setIsPlaying(false);
          setPlayerError(getYouTubePlayerErrorMessage(event.data));
        },
      },
    });
    return true;
  }, [saveLessonActivity, videoId]);

  const loadNextQuestion = useCallback(async () => {
    if (requestInProgressRef.current || quizExhausted) return;

    const player = playerRef.current;
    player?.pauseVideo();
    setIsPlaying(false);
    setQuestionLoading(true);
    setQuestionError(null);
    requestInProgressRef.current = true;

    try {
      const index = nextQuestionIndexRef.current;
      const response = await fetch(
        `/api/lessons/${lessonId}/quiz?index=${index}`,
        { cache: "no-store" },
      );

      const result = (await response.json()) as StudentQuestion & { error?: string };
      if (response.status === 404 && result.error === "No more questions.") {
        setQuizExhausted(true);
        player?.playVideo();
        return;
      }
      if (!response.ok) {
        throw new Error(result.error ?? "The check-in question could not be loaded.");
      }

      const nextQuestion = result;
      setQuestion(nextQuestion);
      setSelectedOption(null);
      setFeedback(null);
      nextQuestionIndexRef.current += 1;

      const currentTime = player?.getCurrentTime() ?? nextPromptAtRef.current;
      nextPromptAtRef.current =
        Math.floor(currentTime / QUIZ_INTERVAL_SECONDS) * QUIZ_INTERVAL_SECONDS +
        QUIZ_INTERVAL_SECONDS;
    } catch (error) {
      setQuestionError(
        error instanceof Error ? error.message : "The check-in question could not be loaded.",
      );
    } finally {
      setQuestionLoading(false);
      requestInProgressRef.current = false;
    }
  }, [lessonId, quizExhausted]);

  useEffect(() => {
    try {
      const savedProgress = sessionStorage.getItem(`goda-lesson-quiz-${lessonId}`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress) as {
          nextQuestionIndex?: unknown;
          nextPromptAt?: unknown;
        };
        if (
          typeof progress.nextQuestionIndex === "number" &&
          Number.isInteger(progress.nextQuestionIndex) &&
          progress.nextQuestionIndex >= 0 &&
          typeof progress.nextPromptAt === "number" &&
          Number.isFinite(progress.nextPromptAt) &&
          progress.nextPromptAt >= QUIZ_INTERVAL_SECONDS
        ) {
          nextQuestionIndexRef.current = progress.nextQuestionIndex;
          nextPromptAtRef.current = progress.nextPromptAt;
        }
      }
    } catch {
      // Ignore malformed or unavailable session progress and start this viewing session at the first question.
    }
  }, [lessonId]);

  useEffect(() => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (initializePlayer()) {
        window.clearInterval(timer);
      } else if (attempts >= 100) {
        window.clearInterval(timer);
        setPlayerError("The video player did not load. Refresh the page to try again.");
      }
    }, 100);

    return () => {
      window.clearInterval(timer);
      const player = playerRef.current;
      const previousTime = lastTrackedVideoTimeRef.current;
      if (player && previousTime !== null) {
        const watchedSeconds = Math.min(30, Math.max(0, Math.floor(player.getCurrentTime() - previousTime)));
        if (watchedSeconds > 0) void saveLessonActivity(watchedSeconds, false);
      }
      lastTrackedVideoTimeRef.current = null;
      player?.destroy();
      playerRef.current = null;
    };
  }, [initializePlayer, saveLessonActivity]);

  useEffect(() => {
    if (!isPlaying || quizExhausted) return;

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || requestInProgressRef.current) return;

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      if (
        currentTime >= nextPromptAtRef.current &&
        duration > nextPromptAtRef.current
      ) {
        void loadNextQuestion();
      }
    }, 400);

    return () => window.clearInterval(timer);
  }, [isPlaying, loadNextQuestion, quizExhausted]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || activitySaveInProgressRef.current) return;

      const currentTime = player.getCurrentTime();
      const previousTime = lastTrackedVideoTimeRef.current;
      lastTrackedVideoTimeRef.current = currentTime;
      if (previousTime === null) return;

      const watchedSeconds = Math.min(30, Math.max(0, Math.floor(currentTime - previousTime)));
      if (watchedSeconds === 0) return;

      void saveLessonActivity(watchedSeconds, false);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [isPlaying, lessonId, saveLessonActivity]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  async function submitAnswer() {
    if (!question || !selectedOption || feedback || answerSubmitting) return;
    setAnswerSubmitting(true);
    setQuestionError(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: question.index, answer: selectedOption }),
      });
      const result = (await response.json()) as QuizFeedback & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your answer could not be checked.");

      try {
        sessionStorage.setItem(
          `goda-lesson-quiz-${lessonId}`,
          JSON.stringify({
            nextQuestionIndex: nextQuestionIndexRef.current,
            nextPromptAt: nextPromptAtRef.current,
          }),
        );
      } catch {
        // Session storage may be unavailable in private browsing; the in-memory sequence still works.
      }

      setFeedback(result);
      playerRef.current?.playVideo();
      closeTimerRef.current = window.setTimeout(() => {
        setQuestion(null);
        setSelectedOption(null);
        setFeedback(null);
      }, 1800);
    } catch (error) {
      setQuestionError(
        error instanceof Error ? error.message : "Your answer could not be checked.",
      );
    } finally {
      setAnswerSubmitting(false);
    }
  }

  const handleScriptReady = useCallback(() => {
    initializePlayer();
  }, [initializePlayer]);

  const effectiveCompletedCount = Math.min(
    totalLessonCount,
    completedLessonCount + (isLessonCompleted && !initiallyCompleted ? 1 : 0),
  );
  const courseProgress = totalLessonCount
    ? Math.round((effectiveCompletedCount / totalLessonCount) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onReady={handleScriptReady}
        onError={() => setPlayerError("The video player could not be loaded. Refresh the page to try again.")}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardPageBanner
          description={`${moduleTitle} · ${lessonTitle}`}
          icon="lucide:play-circle"
          title={courseTitle}
        />
        <Link
          href="/dashboard/courses"
          className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <DashboardIcon aria-hidden="true" className="size-4" icon="lucide:arrow-left" />
          Back to my courses
        </Link>

        <section className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Course progress</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {effectiveCompletedCount} of {totalLessonCount} lessons completed
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums">{courseProgress}%</span>
          </div>
          <div
            aria-label="Course progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={courseProgress}
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </section>

        <button
          aria-controls={isOutlineOpen ? "course-outline" : undefined}
          aria-expanded={isOutlineOpen}
          className="mb-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setIsOutlineOpen((open) => !open)}
          type="button"
        >
          {isOutlineOpen ? (
            <PanelLeftClose aria-hidden="true" className="size-4" />
          ) : (
            <PanelLeftOpen aria-hidden="true" className="size-4" />
          )}
          {isOutlineOpen ? "Hide course outline" : "Show course outline"}
        </button>

        <div className={`grid gap-6 lg:gap-8 ${isOutlineOpen ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
          <section className="min-w-0">
            <p className="text-sm font-medium text-primary">{courseTitle}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {lessonTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{moduleTitle}</p>

            <div
              aria-label={`${lessonTitle} video player`}
              className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-sm"
              role="region"
            >
              <div ref={playerContainerRef} className="absolute inset-0 size-full" />
              {playerError && (
                <p
                  role="alert"
                  className="absolute inset-x-3 bottom-3 rounded-lg bg-background/95 px-4 py-3 text-sm text-destructive shadow"
                >
                  {playerError}
                </p>
              )}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              A short knowledge check will pause the video at two-minute intervals.
            </p>
            {questionLoading && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <DashboardIcon aria-hidden="true" className="size-4 animate-spin" icon="lucide:loader-circle" />
                Loading your next check-in
              </p>
            )}
            {questionError && !question && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p role="alert" className="text-sm text-destructive">{questionError}</p>
                <button
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void loadNextQuestion()}
                  type="button"
                >
                  Retry check-in
                </button>
              </div>
            )}
            {activitySaveError && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-destructive" role="alert">{activitySaveError}</p>
                <button
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void saveLessonActivity()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            )}

            <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <h3 className="text-base font-semibold">Lesson content</h3>
                <span className="text-xs text-muted-foreground">Scroll to read</span>
              </div>
              <div
                aria-label="Scrollable lesson content"
                className="max-h-[28rem] overflow-y-auto border-t border-border px-5 py-5 text-sm leading-7 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_ul]:list-disc"
                tabIndex={0}
              >
                {children}
              </div>
            </section>

            <nav aria-label="Lesson navigation" className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              {previousLesson?.canView ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/dashboard/lessons/${previousLesson.id}`}
                >
                  Previous lesson
                </Link>
              ) : (
                <button
                  aria-label={previousLesson ? `Previous lesson locked: ${previousLesson.title}` : "No previous lesson"}
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-60"
                  disabled
                  type="button"
                >
                  Previous lesson
                </button>
              )}
              {nextLesson?.canView ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/dashboard/lessons/${nextLesson.id}`}
                >
                  Next lesson
                </Link>
              ) : (
                <button
                  aria-label={nextLesson ? `Next lesson locked: ${nextLesson.title}` : "No next lesson"}
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-60"
                  disabled
                  type="button"
                >
                  Next lesson
                </button>
              )}
            </nav>
          </section>

          {isOutlineOpen && (
            <aside
              className="h-fit min-w-0 rounded-xl border border-border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
              id="course-outline"
            >
                <div className="border-b border-border px-4 py-4">
                  <h3 className="font-semibold">Course content</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {effectiveCompletedCount} of {totalLessonCount} lessons complete
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {lessonOutline.map((courseModule) => (
                    <details
                      className="group"
                      key={courseModule.id}
                      open={courseModule.lessons.some((courseLesson) => courseLesson.isCurrent)}
                    >
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{courseModule.name}</span>
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            {courseModule.lessons.length} {courseModule.lessons.length === 1 ? "lesson" : "lessons"}
                          </span>
                        </span>
                        <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <ol className="space-y-1 px-2 pb-3">
                        {courseModule.lessons.map((courseLesson) => {
                          const isCompleted = courseLesson.isCompleted || (
                            courseLesson.isCurrent && isLessonCompleted
                          );
                          const contents = (
                            <>
                              <span className="mt-0.5 shrink-0">
                                {isCompleted ? (
                                  <Check aria-label="Completed" className="size-4 text-emerald-600 dark:text-emerald-400" />
                                ) : courseLesson.canView ? (
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 block size-3.5 rounded-full border ${
                                      courseLesson.isCurrent ? "border-primary bg-primary" : "border-muted-foreground/50"
                                    }`}
                                  />
                                ) : (
                                  <LockKeyhole aria-label="Locked" className="size-4 text-muted-foreground" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm leading-5">{courseLesson.title}</span>
                                <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock aria-hidden="true" className="size-3" />
                                  {formatLessonDuration(courseLesson.durationSeconds)}
                                </span>
                              </span>
                            </>
                          );

                          return (
                            <li key={courseLesson.id}>
                              {courseLesson.canView ? (
                                <Link
                                  aria-current={courseLesson.isCurrent ? "page" : undefined}
                                  className={`flex min-h-12 items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    courseLesson.isCurrent ? "bg-primary/10" : ""
                                  }`}
                                  href={`/dashboard/lessons/${courseLesson.id}`}
                                >
                                  {contents}
                                </Link>
                              ) : (
                                <div
                                  aria-label={`Locked lesson: ${courseLesson.title}`}
                                  className="flex min-h-12 items-start gap-3 rounded-lg px-3 py-2.5 text-muted-foreground"
                                  role="group"
                                >
                                  {contents}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    </details>
                  ))}
                </div>
            </aside>
          )}
        </div>
      </div>

      {question && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/55 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="lesson-quiz-title"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:p-7"
            role="dialog"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Video check-in · Question {question.index + 1}
            </p>
            <h2 id="lesson-quiz-title" className="mt-3 text-xl font-semibold leading-snug">
              {question.question}
            </h2>

            <fieldset className="mt-5 space-y-3" disabled={feedback !== null}>
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((option) => {
                const isCorrectAnswer = feedback?.correctOption === option.id;
                const isChosenWrongAnswer =
                  feedback?.correct === false && selectedOption === option.id;

                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                      isCorrectAnswer
                        ? "border-emerald-600 bg-emerald-500/10"
                        : isChosenWrongAnswer
                          ? "border-destructive bg-destructive/10"
                          : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <input
                      checked={selectedOption === option.id}
                      className="mt-1 size-4 accent-primary"
                      name="lesson-quiz-answer"
                      onChange={() => setSelectedOption(option.id)}
                      type="radio"
                      value={option.id}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-6">
                      <span className="mr-2 font-semibold">{option.id}.</span>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {feedback && (
              <div
                aria-live="polite"
                className={`mt-5 flex items-start gap-3 rounded-lg p-4 text-sm ${
                  feedback.correct
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {feedback.correct ? (
                  <DashboardIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" icon="lucide:circle-check" />
                ) : (
                  <DashboardIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" icon="lucide:circle-x" />
                )}
                <div>
                  <p className="font-semibold">
                    {feedback.correct ? "Correct — the lesson is resuming." : "Not quite."}
                  </p>
                  {!feedback.correct && feedback.correctAnswer && (
                    <p className="mt-1 text-foreground">
                      Correct answer:{" "}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {feedback.correctOption}. {feedback.correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {questionError && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <DashboardIcon aria-hidden="true" className="size-4 shrink-0" icon="lucide:circle-alert" />
                {questionError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {questionError && !feedback && (
                <button
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => void (question ? submitAnswer() : loadNextQuestion())}
                  disabled={questionLoading || answerSubmitting}
                  type="button"
                >
                  {question ? "Retry answer" : "Try again"}
                </button>
              )}
              {!feedback && (
                <button
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedOption || questionLoading || answerSubmitting}
                  onClick={() => void submitAnswer()}
                  type="button"
                >
                  {answerSubmitting ? "Checking answer…" : "Submit answer"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
