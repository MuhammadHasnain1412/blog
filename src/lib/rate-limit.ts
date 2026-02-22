/**
 * In-memory rate limiter — sliding window algorithm.
 *
 * Works correctly for a single EC2 instance running one PM2 process.
 * If you ever scale to multiple instances or PM2 cluster mode,
 * replace the Map with Redis (Upstash has a free tier that works well).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store — lives for the lifetime of the Node process
const store = new Map<string, RateLimitEntry>();

// ✅ Clean up expired entries every minute to prevent memory leaks
// Without this, the Map grows unbounded on a long-running server
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

function rateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(identifier);

  // First request in this window, or window has expired — start fresh
  if (!existing || existing.resetAt <= now) {
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(identifier, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Window is active and limit is hit
  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  // Window is active and limit is not yet hit
  existing.count++;
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

// ── Pre-configured limiters ───────────────────────────────────────────────────

/** Login: 5 attempts per IP per 15 minutes */
export function loginLimiter(ip: string): RateLimitResult {
  return rateLimit(`login:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });
}

/** File uploads: 10 per IP per minute */
export function uploadLimiter(ip: string): RateLimitResult {
  return rateLimit(`upload:${ip}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
}

/** General API: 100 requests per IP per minute */
export function apiLimiter(ip: string): RateLimitResult {
  return rateLimit(`api:${ip}`, {
    maxRequests: 100,
    windowMs: 60 * 1000,
  });
}