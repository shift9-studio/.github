export type WaitlistOutcome =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "invalid" | "unconfigured" | "error" };

export function publicWaitlistResponse(result: WaitlistOutcome) {
  if (result.ok || result.reason === "duplicate") {
    return { body: { ok: true } as const, status: 200 };
  }

  const status =
    result.reason === "invalid"
      ? 400
      : result.reason === "unconfigured"
        ? 503
        : 500;
  return { body: result, status };
}

export function createRateLimiter({
  windowMs,
  maxRequests,
  maxBuckets,
}: {
  windowMs: number;
  maxRequests: number;
  maxBuckets: number;
}) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string, now = Date.now()) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }

    const current = buckets.get(key);
    if (!current) {
      if (buckets.size >= maxBuckets) {
        const oldestKey = buckets.keys().next().value as string | undefined;
        if (oldestKey) buckets.delete(oldestKey);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    current.count += 1;
    return current.count > maxRequests;
  };
}
