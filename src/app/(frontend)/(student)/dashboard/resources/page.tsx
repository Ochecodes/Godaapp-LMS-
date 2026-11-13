import { getPayload } from "payload";
import config from "@/payload.config";
import { StudentResourcesPage } from "@/components/StudentDashboardPages";

export default async function StudentResourcesRoute() {
  const payload = await getPayload({ config });
  const queryStartedAt = performance.now();
  const result = await payload.find({
    collection: "resources",
    where: { status: { equals: "published" } },
    sort: "sortOrder",
    select: {
      title: true,
      category: true,
      description: true,
      externalUrl: true,
      format: true,
    },
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
  });
  const queryMs = performance.now() - queryStartedAt;
  if (queryMs > 1000) {
    console.warn("[Dashboard] Resources query was slow.", {
      queryMs: Math.round(queryMs),
      resourceCount: result.docs.length,
    });
  }

  return (
    <StudentResourcesPage
      resources={result.docs.map((resource) => ({
        title: resource.title,
        category: resource.category,
        description: resource.description,
        url: resource.externalUrl,
        format: resource.format,
      }))}
    />
  );
}