export function getRequestOrigin(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host) return requestUrl.origin;

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol === "https" || forwardedProtocol === "http"
      ? forwardedProtocol
      : requestUrl.protocol.slice(0, -1);

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export function hasSameOrigin(request: Request): boolean {
  const requestOrigin = getRequestOrigin(request);
  const origin = request.headers.get("origin");
  if (!requestOrigin || !origin) return false;

  try {
    return new URL(origin).origin === requestOrigin;
  } catch {
    return false;
  }
}
