import { NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Course, Lesson, Module } from "../../../../../../payload-types";
import config from "@/payload.config";

export const dynamic = "force-dynamic";
const cacheHeaders = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};

type CourseWithOriginalPrice = Course & { originalPriceUSD?: number | null };
type FeaturedCourseDetails = {
  priceUSD: number;
  originalPriceUSD: number | null;
  lessons: {
    id: number;
    title: string;
    isPreview: boolean;
  }[];
};

function getRelationId(relation: number | { id: number }) {
  return typeof relation === "number" ? relation : relation.id;
}

export async function GET() {
  const startedAt = Date.now();
  const payload = await getPayload({ config });
  const payloadReadyAt = Date.now();
  const coursesResult = await payload.find({
    collection: "courses",
    where: {
      and: [
        { status: { equals: "published" } },
        {
          slug: {
            in: [
              "cryptocurrency-market-and-trading-fundamentals",
              "forex-trading-and-beginners-fundamentals",
              "risk-management-trading-psychology",
              "capital-management-and-prop-firm-preparation",
              "introduction-to-portfolio-management-and-copy-trading",
              "algorithmic-trading-using-pinescript",
            ],
          },
        },
      ],
    },
    select: { id: true, slug: true, priceUSD: true, originalPriceUSD: true },
    depth: 0,
    limit: 6,
    pagination: false,
    overrideAccess: true,
  });
  const coursesLoadedAt = Date.now();
  const courses = coursesResult.docs as CourseWithOriginalPrice[];
  if (!courses.length) return NextResponse.json({}, { headers: cacheHeaders });

  const courseIds = courses.map((course) => course.id);
  const modulesResult = await payload.find({
    collection: "modules",
    where: { course: { in: courseIds } },
    select: { id: true, course: true, sortOrder: true },
    depth: 0,
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  });
  const modulesLoadedAt = Date.now();
  const modules = modulesResult.docs as Module[];
  const moduleIds = modules.map((courseModule) => courseModule.id);
  const lessonsResult = moduleIds.length
    ? await payload.find({
        collection: "lessons",
        where: { module: { in: moduleIds } },
        select: { id: true, module: true, title: true, isPreview: true, sortOrder: true },
        depth: 0,
        limit: 10000,
        pagination: false,
        overrideAccess: true,
      })
    : { docs: [] as Lesson[] };
  const lessonsLoadedAt = Date.now();
  const lessons = lessonsResult.docs as Lesson[];

  const modulesByCourse = new Map<number, Module[]>();
  for (const courseModule of modules) {
    const courseId = getRelationId(courseModule.course);
    const courseModules = modulesByCourse.get(courseId) ?? [];
    courseModules.push(courseModule);
    modulesByCourse.set(courseId, courseModules);
  }
  const lessonsByModule = new Map<number, Lesson[]>();
  for (const lesson of lessons) {
    const moduleId = getRelationId(lesson.module);
    const moduleLessons = lessonsByModule.get(moduleId) ?? [];
    moduleLessons.push(lesson);
    lessonsByModule.set(moduleId, moduleLessons);
  }

  const featuredCourseDetails: Record<string, FeaturedCourseDetails> = {};
  for (const course of courses) {
    const courseModules = (modulesByCourse.get(course.id) ?? []).sort(
      (first, second) => first.sortOrder - second.sortOrder,
    );
    const courseLessons = courseModules.flatMap((courseModule) =>
      (lessonsByModule.get(courseModule.id) ?? []).sort((first, second) => first.sortOrder - second.sortOrder),
    );
    featuredCourseDetails[course.slug] = {
      priceUSD: course.priceUSD,
      originalPriceUSD: course.priceUSD > 0
        ? course.originalPriceUSD ?? course.priceUSD * 2
        : null,
      lessons: courseLessons.map(({ id, title, isPreview }) => ({
        id,
        title,
        isPreview: isPreview === true,
      })),
    };
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs >= 5000) {
    console.warn("[Catalog] Featured course query was slow.", {
      payloadReadyMs: payloadReadyAt - startedAt,
      coursesQueryMs: coursesLoadedAt - payloadReadyAt,
      modulesQueryMs: modulesLoadedAt - coursesLoadedAt,
      lessonsQueryMs: lessonsLoadedAt - modulesLoadedAt,
      elapsedMs,
    });
  }

  return NextResponse.json(featuredCourseDetails, { headers: cacheHeaders });
}
