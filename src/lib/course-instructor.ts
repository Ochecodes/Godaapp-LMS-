export function getCourseInstructorName(courseTitle: string): string {
  const title = courseTitle.toLowerCase();
  if (title.includes("portfolio") || title.includes("pinescript") || title.includes("algorithmic")) return "Oche Akor";
  if (title.includes("crypto") || title.includes("forex") || title.includes("risk") || title.includes("capital")) return "Udoyen Peter Snr";
  return "GodaApp Instructor";
}
