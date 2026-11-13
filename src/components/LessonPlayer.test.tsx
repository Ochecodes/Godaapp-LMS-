import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordStudentLessonActivity: vi.fn(),
}));

vi.mock("@/app/(frontend)/(student)/dashboard/actions", () => ({
  recordStudentLessonActivity: mocks.recordStudentLessonActivity,
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("next/script", () => ({ default: () => null }));
vi.mock("@/components/DashboardPageBanner", () => ({
  DashboardPageBanner: ({ title }: { title: string }) => <header>{title}</header>,
}));

import { LessonPlayer } from "@/components/LessonPlayer";

type PlayerOptions = ConstructorParameters<NonNullable<typeof window.YT>["Player"]>[1];
let playerStateChange: ((event: { data: number }) => void) | null = null;

const outline = [
  {
    id: 1,
    name: "Foundations",
    lessons: [
      {
        id: 1,
        title: "Introduction",
        durationSeconds: 125,
        isPreview: true,
        canView: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 2,
        title: "Current lesson",
        durationSeconds: 65,
        isPreview: true,
        canView: true,
        isCompleted: false,
        isCurrent: true,
      },
    ],
  },
  {
    id: 2,
    name: "Advanced",
    lessons: [
      {
        id: 3,
        title: "Locked lesson",
        durationSeconds: 3600,
        isPreview: false,
        canView: false,
        isCompleted: false,
        isCurrent: false,
      },
    ],
  },
];

function renderLessonPlayer() {
  return render(
    <LessonPlayer
      lessonId={2}
      lessonTitle="Current lesson"
      moduleTitle="Foundations"
      courseTitle="Digital assets"
      videoId="video-id"
      lessonOutline={outline}
      previousLesson={outline[0].lessons[0]}
      nextLesson={outline[1].lessons[0]}
      completedLessonCount={1}
      totalLessonCount={3}
      initiallyCompleted={false}
    >
      <p>Lesson notes and resources.</p>
    </LessonPlayer>,
  );
}

describe("LessonPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordStudentLessonActivity.mockResolvedValue({ success: true });
    playerStateChange = null;
    window.YT = {
      Player: class {
        constructor(_element: HTMLElement, options: PlayerOptions) {
          playerStateChange = options.events.onStateChange;
        }
        getCurrentTime() { return 0; }
        getDuration() { return 0; }
        pauseVideo() {}
        playVideo() {}
        destroy() {}
      },
      PlayerState: { PLAYING: 1, ENDED: 0 },
    };
  });

  it("renders lesson content, duration, access status, navigation, and course progress", () => {
    renderLessonPlayer();

    expect(screen.getByText("Lesson notes and resources.")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(screen.getByText("1:00:00")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Course progress" })).toHaveAttribute(
      "aria-valuenow",
      "33",
    );
    expect(screen.getByRole("link", { name: "Previous lesson" })).toHaveAttribute(
      "href",
      "/dashboard/lessons/1",
    );
    expect(screen.getByRole("button", { name: "Next lesson locked: Locked lesson" })).toBeDisabled();
    expect(screen.getByLabelText("Locked lesson: Locked lesson")).toBeInTheDocument();
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      "/dashboard/lessons/2",
    );
  });

  it("collapses and restores the course outline with an accessible toggle", () => {
    renderLessonPlayer();

    fireEvent.click(screen.getByRole("button", { name: "Hide course outline" }));

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show course outline" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show course outline" }));

    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide course outline" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("updates course progress when the video ends and completion is saved", async () => {
    renderLessonPlayer();
    await waitFor(() => expect(playerStateChange).toBeTypeOf("function"));

    act(() => {
      playerStateChange?.({ data: window.YT!.PlayerState.ENDED });
    });

    await waitFor(() => {
      expect(mocks.recordStudentLessonActivity).toHaveBeenCalledWith(2, 0, true);
      expect(screen.getByRole("progressbar", { name: "Course progress" })).toHaveAttribute(
        "aria-valuenow",
        "67",
      );
    });
  });
});
