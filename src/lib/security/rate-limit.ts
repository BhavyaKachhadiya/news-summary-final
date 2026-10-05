import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  limit?: number; // max requests allowed in window
  windowMs?: number; // window duration in ms
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Extracts a client identifier from standard IP headers (x-forwarded-for, x-real-ip)
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * In-memory sliding window rate limiter per key (e.g. client IP)
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { limit = 10, windowMs = 60 * 1000, keyPrefix = "rl" } = options;
  const storeKey = `${keyPrefix}:${key}`;
  const now = Date.now();

  const record = rateLimitStore.get(storeKey);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetAt / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetAt / 1000),
  };
}
