import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { redis } from "./redis";

/// Only the handful of abuse-prone, low-friction procedures get a
/// limiter — see docs/roadmap/08-reliability-hardening.md's non-goals.
/// Board/card CRUD stays unthrottled; a legitimate team moving cards
/// quickly shouldn't get rate-limited.
const limiters = {
  signup: new RateLimiterRedis({ storeClient: redis, keyPrefix: "rl:signup", points: 5, duration: 60 * 60 }),
  login: new RateLimiterRedis({ storeClient: redis, keyPrefix: "rl:login", points: 10, duration: 15 * 60 }),
  invite: new RateLimiterRedis({ storeClient: redis, keyPrefix: "rl:invite", points: 20, duration: 60 * 60 }),
  comment: new RateLimiterRedis({ storeClient: redis, keyPrefix: "rl:comment", points: 30, duration: 10 * 60 }),
};

export type RateLimitedAction = keyof typeof limiters;

export class RateLimitExceededError extends Error {
  constructor(public retrySeconds: number) {
    super(`Too many requests — try again in ${retrySeconds}s.`);
    this.name = "RateLimitExceededError";
  }
}

/// Throws RateLimitExceededError if `key` (an IP or userId) has used up
/// its budget for `action`. Fails OPEN on any Redis-level error (network
/// blip, Redis Cloud hiccup) — rate limiting is a safety net, not a
/// dependency the whole app should go down with; only a genuine
/// over-the-limit result blocks the request.
export async function checkRateLimit(action: RateLimitedAction, key: string): Promise<void> {
  try {
    await limiters[action].consume(key);
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      throw new RateLimitExceededError(Math.ceil(err.msBeforeNext / 1000));
    }
    console.error(`[ratelimit] Redis error checking "${action}" for "${key}", failing open:`, err);
  }
}
