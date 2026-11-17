import config from "@payload-config";
import "@payloadcms/next/css";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

import { getClientAddress } from "@/lib/rate-limit";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

function withApiRateLimit<TRequest extends Request, TContext>(
  handler: (request: TRequest, context: TContext) => Promise<Response>,
) {
  return async (request: TRequest, context: TContext): Promise<Response> => {
    const address = getClientAddress(request);
    if (!address) {
      return Response.json({ error: "The service is temporarily unavailable." }, { status: 503 });
    }

    const limited = await enforceApiRateLimit(
      `payload-api:ip:${address}`,
      600,
      10 * 60,
      "Payload API",
    );
    if (limited) return limited;
    return handler(request, context);
  };
}

export const GET = withApiRateLimit(REST_GET(config));
export const POST = withApiRateLimit(REST_POST(config));
export const DELETE = withApiRateLimit(REST_DELETE(config));
export const PATCH = withApiRateLimit(REST_PATCH(config));
export const PUT = withApiRateLimit(REST_PUT(config));
export const OPTIONS = REST_OPTIONS(config);
