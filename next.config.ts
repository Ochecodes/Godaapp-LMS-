import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  serverExternalPackages: ["prettier"],
};

export default withSentryConfig(withPayload(nextConfig), {
  silent: !process.env.CI,
  sourcemaps: {
    filesToDeleteAfterUpload: [".next/static/**/*.map"],
  },
});