import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./src/lib/sentry-sanitize";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend: sanitizeSentryEvent,
});
