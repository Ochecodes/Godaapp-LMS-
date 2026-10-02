import type { Metadata } from "next";

import config from "@payload-config";
import { generatePageMetadata, NotFoundPage } from "@payloadcms/next/views";
import { importMap } from "../importMap.js";

type PageArgs = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const generateMetadata = ({ params, searchParams }: PageArgs): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default function InstructorPanelNotFound({ params, searchParams }: PageArgs) {
  return NotFoundPage({ config, params, searchParams, importMap });
}
