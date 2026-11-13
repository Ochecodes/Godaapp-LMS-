import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createAdminClient, getSupabaseSecretKey } from "@/lib/supabase/admin";

type RateLimitRule = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitRpcResult = {
  allowed: boolean;
  retry_after_seconds: number;
};

type LocalRateLimitBucket = {
  count: number;
  resetsAt: number;
};

const localBuckets = new Map<string, LocalRateLimitBucket>();
let warnedAboutLocalRateLimits = false;

function isRateLimitRpcResult(value: unknown): value is RateLimitRpcResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "allowed" in value &&
    typeof value.allowed === "boolean" &&
    "retry_after_seconds" in value &&
    typeof value.retry_after_seconds === "number"
  );
}

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function getClientAddress(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp)) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedAddresses = forwardedFor?.split(",").map((address) => address.trim());
  const trustedProxyAddress = forwardedAddresses?.at(-1);
  if (trustedProxyAddress && isIP(trustedProxyAddress)) return trustedProxyAddress;

  if (process.env.NODE_ENV === "production") return null;
  return forwardedAddresses?.find((address) => isIP(address)) ?? "127.0.0.1";
}

export async function checkRateLimit(rules: RateLimitRule[]): Promise<RateLimitResult> {
  if (rules.length === 0 || rules.length > 4) {
    throw new Error("Rate-limit requests must include between one and four rules.");
  }

  for (const rule of rules) {
    if (
      !rule.key ||
      !Number.isInteger(rule.limit) ||
      rule.limit < 1 ||
      !Number.isInteger(rule.windowSeconds) ||
      rule.windowSeconds < 1
    ) {
      throw new Error("A rate-limit rule contains invalid values.");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (!warnedAboutLocalRateLimits) {
      console.warn("[RateLimit] Development is using a process-local limiter; production uses Supabase Postgres.");
      warnedAboutLocalRateLimits = true;
    }
    return checkLocalRateLimit(rules);
  }

  const hmacSecret = getSupabaseSecretKey();

  const keyHashes = rules.map((rule) =>
    createHmac("sha256", hmacSecret).update(rule.key).digest("hex"),
  );
  const { data, error } = await createAdminClient().rpc("consume_app_rate_limits", {
    p_key_hashes: keyHashes,
    p_limits: rules.map((rule) => rule.limit),
    p_window_seconds: rules.map((rule) => rule.windowSeconds),
  });

  if (error) {
    throw new Error(`Supabase rate-limit check failed: ${error.message}`);
  }

  const result: unknown = Array.isArray(data) ? data[0] : undefined;
  if (!isRateLimitRpcResult(result)) {
    throw new Error("Supabase rate-limit check returned an invalid response.");
  }

  return {
    allowed: result.allowed,
    retryAfterSeconds: Math.max(0, Number(result.retry_after_seconds) || 0),
  };
}

function checkLocalRateLimit(rules: RateLimitRule[]): RateLimitResult {
  const now = Date.now();
  let retryAfterSeconds = 0;

  for (const rule of rules) {
    const bucket = localBuckets.get(rule.key);
    if (!bucket || bucket.resetsAt <= now) {
      localBuckets.set(rule.key, {
        count: 1,
        resetsAt: now + rule.windowSeconds * 1000,
      });
      continue;
    }

    bucket.count += 1;
    if (bucket.count > rule.limit) {
      retryAfterSeconds = Math.max(
        retryAfterSeconds,
        Math.ceil((bucket.resetsAt - now) / 1000),
      );
    }
  }

  if (localBuckets.size > 10_000) {
    for (const [key, bucket] of localBuckets) {
      if (bucket.resetsAt <= now) localBuckets.delete(key);
      if (localBuckets.size <= 8_000) break;
    }
  }

  return { allowed: retryAfterSeconds === 0, retryAfterSeconds };
}
