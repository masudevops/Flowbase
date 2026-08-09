import Redis from "ioredis";

// Cached across hot-reloads/warm invocations, same reasoning as
// src/lib/prisma.ts — a fresh ioredis client per request would open (and
// leak) a new TCP connection instead of reusing one.
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 2,
    // Rate limiting must never be the reason a request hangs — if Redis
    // is slow or unreachable, fail open (see ratelimit.ts) rather than
    // block the actual mutation behind a stalled connection retry.
    connectTimeout: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
