import type { Event } from "@sentry/nextjs";

export function sanitizeSentryEvent<T extends Event>(event: T): T {
  const request = event.request;
  if (!request) return event;

  delete request.data;
  delete request.cookies;
  delete request.query_string;

  if (request.headers) {
    for (const header of Object.keys(request.headers)) {
      if (/^(authorization|cookie|set-cookie|x-api-key)$/i.test(header)) {
        delete request.headers[header];
      }
    }
  }

  if (request.url) {
    try {
      const url = new URL(request.url);
      request.url = `${url.origin}${url.pathname}`;
    } catch {
      delete request.url;
    }
  }

  return event;
}
