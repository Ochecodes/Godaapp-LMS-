import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import { normalizeStudentEmail } from '@/lib/student-email'
import { getStudentLearningActivity } from '@/lib/student-learning-activity'
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

export type StudentLessonAccess = AuthorizedStudentLesson & {
  canView: boolean
}

export type StudentLessonOutlineItem = {
  id: number
  title: string
  durationSeconds?: number | null
  isPreview: boolean
  canView: boolean
  isCompleted: boolean
  isCurrent: boolean
}

export type StudentLessonOutlineModule = {
  id: number
  name: string
  lessons: StudentLessonOutlineItem[]
}

export type StudentLessonView = StudentLessonAccess & {
  outline: StudentLessonOutlineModule[]
  completedLessonCount: number
  totalLessonCount: number
  previousLesson: StudentLessonOutlineItem | null
  nextLesson: StudentLessonOutlineItem | null
}

function getRelationId(relation: number | { id: number }) {
  return typeof relation === 'number' ? relation : relation.id
}

function loadStudentLessonAccess(lessonId: number, includeOutline: true): Promise<StudentLessonView | null>
function loadStudentLessonAccess(lessonId: number, includeOutline: false): Promise<StudentLessonAccess | null>
async function loadStudentLessonAccess(
  lessonId: number,
  includeOutline: boolean,
): Promise<StudentLessonAccess | StudentLessonView | null> {
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

  let lessonModule: Module
  if (typeof lesson.module === 'number') {
    lessonModule = await payload.findByID({
      collection: 'modules',
      id: lesson.module,
      overrideAccess: true,
    })
  } else {
    lessonModule = lesson.module
  }

  let course: Course
  if (typeof lessonModule.course === 'number') {
    course = await payload.findByID({
      collection: 'courses',
      id: lessonModule.course,
      overrideAccess: true,
    })
  } else {
    course = lessonModule.course
  }

  if (course.status !== 'published') return null

  const isFreeCourse = course.priceUSD === 0
  let isEnrolled = false
  if (
    !isFreeCourse &&
    (includeOutline || lesson.isPreview !== true) &&
    user.email
  ) {
    const enrollments = await payload.find({
      collection: 'enrollments',
      where: {
        and: [
          { course: { equals: course.id } },
          { isActive: { equals: true } },
          { email: { equals: normalizeStudentEmail(user.email) } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    isEnrolled = enrollments.docs.length > 0
  }

  const canView = lesson.isPreview === true || isFreeCourse || isEnrolled
  const access = { lesson, module: lessonModule, course, canView }
  if (!includeOutline) return access

  const modulesResult = await payload.find({
    collection: 'modules',
    where: { course: { equals: course.id } },
    select: { id: true, name: true, sortOrder: true },
    depth: 0,
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  })
  const modules = modulesResult.docs as Module[]
  const moduleIds = modules.map((courseModule) => courseModule.id)
  const lessonsResult = moduleIds.length
    ? await payload.find({
        collection: 'lessons',
        where: { module: { in: moduleIds } },
        select: {
          id: true,
          title: true,
          module: true,
          durationSeconds: true,
          isPreview: true,
          sortOrder: true,
        },
        depth: 0,
        limit: 10000,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Lesson[] }
  const courseLessons = lessonsResult.docs as Lesson[]
  const activity = getStudentLearningActivity(user.user_metadata?.student_learning)
  const outline = [...modules]
    .sort((first, second) => first.sortOrder - second.sortOrder || first.id - second.id)
    .map((courseModule) => ({
      id: courseModule.id,
      name: courseModule.name,
      lessons: courseLessons
        .filter((courseLesson) => getRelationId(courseLesson.module) === courseModule.id)
        .sort((first, second) => first.sortOrder - second.sortOrder || first.id - second.id)
        .map((courseLesson): StudentLessonOutlineItem => ({
          id: courseLesson.id,
          title: courseLesson.title,
          durationSeconds: courseLesson.durationSeconds,
          isPreview: courseLesson.isPreview === true,
          canView: courseLesson.isPreview === true || isFreeCourse || isEnrolled,
          isCompleted:
            activity.lessons[String(courseLesson.id)]?.courseId === course.id &&
            Boolean(activity.lessons[String(courseLesson.id)]?.completedAt),
          isCurrent: courseLesson.id === lesson.id,
        })),
    }))
  const orderedLessons = outline.flatMap((courseModule) => courseModule.lessons)
  const currentIndex = orderedLessons.findIndex((courseLesson) => courseLesson.isCurrent)

  return {
    ...access,
    outline,
    completedLessonCount: orderedLessons.filter((courseLesson) => courseLesson.isCompleted).length,
    totalLessonCount: orderedLessons.length,
    previousLesson: currentIndex > 0 ? orderedLessons[currentIndex - 1] : null,
    nextLesson: currentIndex >= 0 ? orderedLessons[currentIndex + 1] ?? null : null,
  }
}

export async function getStudentLessonAccess(
  lessonId: number,
): Promise<StudentLessonAccess | null> {
  return loadStudentLessonAccess(lessonId, false)
}

export async function getStudentLessonView(
  lessonId: number,
): Promise<StudentLessonView | null> {
  return loadStudentLessonAccess(lessonId, true)
}

export async function getAuthorizedStudentLesson(
  lessonId: number,
): Promise<AuthorizedStudentLesson | null> {
  const access = await getStudentLessonAccess(lessonId)
  if (!access?.canView) return null
  return { lesson: access.lesson, module: access.module, course: access.course }
}
