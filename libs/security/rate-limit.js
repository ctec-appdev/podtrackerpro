const globalStore = globalThis.__shipFastRateLimitStore || new Map();

if (!globalThis.__shipFastRateLimitStore) {
  globalThis.__shipFastRateLimitStore = globalStore;
}

function pruneExpired(now) {
  for (const [key, entry] of globalStore.entries()) {
    if (entry.resetAt <= now) {
      globalStore.delete(key);
    }
  }
}

export function getRequestIdentifier(req, userId = null) {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

  return `ip:${ip}`;
}

export function consumeRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  pruneExpired(now);

  const current = globalStore.get(key);

  if (!current || current.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs,
    };

    globalStore.set(key, next);

    return {
      allowed: true,
      remaining: Math.max(limit - next.count, 0),
      retryAfterMs: windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(current.resetAt - now, 0),
    };
  }

  current.count += 1;
  globalStore.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    retryAfterMs: Math.max(current.resetAt - now, 0),
  };
}

export function resetRateLimitStore() {
  globalStore.clear();
}
