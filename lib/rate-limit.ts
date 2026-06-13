// ---------------------------------------------------------------------------
// Brute-force / abuse protection.
//
// In-memory fixed-window limiter keyed by `ip + route`. This is the zero-dependency
// default. For multi-instance production deployments, back it with Redis
// (e.g. @upstash/ratelimit) — swap the `buckets` Map for a Redis store and keep
// the same `rateLimit()` signature; every caller stays unchanged.
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets
  remaining: number;
}

export function rateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: max - 1 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000), remaining: 0 };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0, remaining: max - b.count };
}

// Spec: "20 auth requests per minute per IP" — the blanket public-endpoint guard.
export function authRateLimit(ip: string, route: string): RateResult {
  return rateLimit(`auth:${route}:${ip}`, 20, 60 * 1000);
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export function userAgent(req: Request): string {
  return req.headers.get("user-agent")?.slice(0, 400) || "";
}

// Periodically drop expired buckets so the Map can't grow unbounded.
let lastSweep = 0;
export function sweepBuckets(): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}
