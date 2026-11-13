import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getAuthorizedStudentLesson: vi.fn(),
  getClientAddress: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientAddress: mocks.getClientAddress,
}));
vi.mock("@/lib/student-lesson-access", () => ({
  getAuthorizedStudentLesson: mocks.getAuthorizedStudentLesson,
}));

import { GET, POST } from "@/app/(frontend)/api/lessons/[lessonId]/quiz/route";

const lessonAccess = {
  lesson: {
    quizQuestions: [
      {
        question: "Which answer is correct?",
        optionA: "Choice A",
        optionB: "Choice B",
        optionC: "Choice C",
        correctOption: "B" as const,
      },
    ],
  },
};

const params = Promise.resolve({ lessonId: "21" });

function request(path: string, method = "GET", body?: unknown) {
  return new Request(`https://godaapp.example${path}`, {
    method,
    headers: { "content-type": "application/json", "x-real-ip": "203.0.113.1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("lesson quiz API", () => {
  beforeEach(() => {
    mocks.getClientAddress.mockReturnValue("203.0.113.1");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getAuthorizedStudentLesson.mockResolvedValue(lessonAccess);
  });

  it("validates question routes before querying the lesson", async () => {
    const invalidLesson = await GET(
      request("/api/lessons/0/quiz?index=0"),
      { params: Promise.resolve({ lessonId: "0" }) },
    );
    const invalidIndex = await GET(
      request("/api/lessons/21/quiz?index=-1"),
      { params },
    );
    const invalidAnswer = await POST(
      request("/api/lessons/21/quiz", "POST", { index: 0, answer: "D" }),
      { params },
    );

    expect(invalidLesson.status).toBe(400);
    expect(invalidIndex.status).toBe(400);
    expect(invalidAnswer.status).toBe(400);
    expect(mocks.getAuthorizedStudentLesson).not.toHaveBeenCalled();
  });

  it("returns quiz question choices without leaking the correct answer", async () => {
    const response = await GET(
      request("/api/lessons/21/quiz?index=0"),
      { params },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      index: 0,
      question: "Which answer is correct?",
      options: [
        { id: "A", text: "Choice A" },
        { id: "B", text: "Choice B" },
        { id: "C", text: "Choice C" },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("correctOption");
  });

  it("returns not-found for inaccessible lessons and exhausted question indexes", async () => {
    mocks.getAuthorizedStudentLesson.mockResolvedValueOnce(null);
    const inaccessible = await GET(
      request("/api/lessons/21/quiz?index=0"),
      { params },
    );

    const outOfQuestions = await GET(
      request("/api/lessons/21/quiz?index=1"),
      { params },
    );

    expect(inaccessible.status).toBe(404);
    expect(outOfQuestions.status).toBe(404);
  });

  it("checks quiz answers and only reveals the correct choice for wrong answers", async () => {
    const correct = await POST(
      request("/api/lessons/21/quiz", "POST", { index: 0, answer: "B" }),
      { params },
    );
    const wrong = await POST(
      request("/api/lessons/21/quiz", "POST", { index: 0, answer: "A" }),
      { params },
    );

    expect(await correct.json()).toEqual({ correct: true });
    expect(await wrong.json()).toEqual({
      correct: false,
      correctOption: "B",
      correctAnswer: "Choice B",
    });
  });

  it("enforces rate limits and fails closed on limiter errors", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 15 });
    const limited = await GET(
      request("/api/lessons/21/quiz?index=0"),
      { params },
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("15");

    mocks.checkRateLimit.mockRejectedValueOnce(new Error("database down"));
    const unavailable = await GET(
      request("/api/lessons/21/quiz?index=0"),
      { params },
    );
    expect(unavailable.status).toBe(503);
  });
});
