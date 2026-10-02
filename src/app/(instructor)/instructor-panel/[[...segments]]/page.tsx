import type { Metadata } from "next";

import config from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import { importMap } from "../importMap.js";

type PageArgs = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export const generateMetadata = ({ params, searchParams }: PageArgs): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default function InstructorPanelPage({ params, searchParams }: PageArgs) {
  return RootPage({ config, params, searchParams, importMap });
}
