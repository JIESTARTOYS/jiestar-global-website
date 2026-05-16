type RateLimitOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  return {
    check(key: string) {
      const currentTime = now();
      const existing = entries.get(key);

      if (!existing || existing.resetAt <= currentTime) {
        entries.set(key, { count: 1, resetAt: currentTime + windowMs });
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: currentTime + windowMs };
      }

      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
      }

      existing.count += 1;

      return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
    },
  };
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}
