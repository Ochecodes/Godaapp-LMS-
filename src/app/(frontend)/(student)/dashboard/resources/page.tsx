import { getPayload } from "payload";
import config from "@/payload.config";
import { StudentResourcesPage } from "@/components/StudentDashboardPages";

export default async function StudentResourcesRoute() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "resources",
    where: { status: { equals: "published" } },
    sort: "sortOrder",
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  });

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