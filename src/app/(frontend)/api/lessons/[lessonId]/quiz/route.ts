import { NextResponse } from 'next/server'
import {
  getAuthorizedStudentLesson,
  type LessonQuizQuestion,
} from '@/lib/student-lesson-access'

type RouteContext = {
  params: Promise<{ lessonId: string }>
}

type QuizChoice = 'A' | 'B' | 'C'

function getQuestion(
  questions: LessonQuizQuestion[] | null | undefined,
  index: number,
) {
  if (!questions || index >= questions.length) return null

  const question = questions[index]
  return {
    question: question.question,
    options: [
      { id: 'A' as const, text: question.optionA },
      { id: 'B' as const, text: question.optionB },
      { id: 'C' as const, text: question.optionC },
    ],
    correctOption: question.correctOption,
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { lessonId: rawLessonId } = await params
  const lessonId = Number(rawLessonId)
  const index = Number(new URL(request.url).searchParams.get('index'))

  if (!Number.isInteger(lessonId) || lessonId < 1 || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: 'Invalid lesson or question.' }, { status: 400 })
  }

  const access = await getAuthorizedStudentLesson(lessonId)
  if (!access) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })

  const question = getQuestion(access.lesson.quizQuestions, index)
  if (!question) return NextResponse.json({ error: 'No more questions.' }, { status: 404 })

  const { correctOption: _correctOption, ...studentQuestion } = question
  return NextResponse.json({ index, ...studentQuestion })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { lessonId: rawLessonId } = await params
  const lessonId = Number(rawLessonId)

  if (!Number.isInteger(lessonId) || lessonId < 1) {
    return NextResponse.json({ error: 'Invalid lesson.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'A question index and one selected option are required.' }, { status: 400 })
  }

  const requestBody = body as Record<string, unknown>
  const index = requestBody.index
  const answer = requestBody.answer
  if (
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    (answer !== 'A' && answer !== 'B' && answer !== 'C')
  ) {
    return NextResponse.json({ error: 'A question index and one selected option are required.' }, { status: 400 })
  }

  const access = await getAuthorizedStudentLesson(lessonId)
  if (!access) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })

  const question = getQuestion(access.lesson.quizQuestions, index)
  if (!question) return NextResponse.json({ error: 'Question not found.' }, { status: 404 })

  const correct = answer === question.correctOption
  return NextResponse.json({
    correct,
    ...(correct
      ? {}
      : {
          correctOption: question.correctOption,
          correctAnswer: question.options.find((option) => option.id === question.correctOption)?.text,
        }),
  })
}
