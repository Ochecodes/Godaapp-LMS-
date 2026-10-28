import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import type { Course, Lesson, Module } from '../../payload-types'

export type LessonQuizQuestion = {
  question: string
  optionA: string
  optionB: string
  optionC: string
  correctOption: 'A' | 'B' | 'C'
}

export type AuthorizedStudentLesson = {
  lesson: Lesson & { quizQuestions?: LessonQuizQuestion[] | null }
  module: Module
  course: Course
}

export async function getAuthorizedStudentLesson(
  lessonId: number,
): Promise<AuthorizedStudentLesson | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const payload = await getPayload({ config })
  const lessonResult = await payload.find({
    collection: 'lessons',
    where: { id: { equals: lessonId } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })
  const lesson = lessonResult.docs[0] as AuthorizedStudentLesson['lesson'] | undefined

  if (!lesson) return null

  let module: Module
  if (typeof lesson.module === 'number') {
    module = await payload.findByID({
      collection: 'modules',
      id: lesson.module,
      overrideAccess: true,
    })
  } else {
    module = lesson.module
  }

  let course: Course
  if (typeof module.course === 'number') {
    course = await payload.findByID({
      collection: 'courses',
      id: module.course,
      overrideAccess: true,
    })
  } else {
    course = module.course
  }

  if (course.status !== 'published') return null

  if (lesson.isPreview) return { lesson, module, course }
  if (!user.email) return null

  const enrollments = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { course: { equals: course.id } },
        { isActive: { equals: true } },
      ],
    },
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  })
  const studentEmail = user.email.trim().toLowerCase()
  const hasEnrollment = enrollments.docs.some(
    (enrollment) => enrollment.email.trim().toLowerCase() === studentEmail,
  )

  return hasEnrollment ? { lesson, module, course } : null
}
