/**
 * In-Memory Sliding Window Rate Limiter
 * Protects AI chat endpoints and auth routes from abuse
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string, 
  maxRequests = 60, 
  windowMs = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();

  // Periodic Memory Pruning to prevent unbounded memory growth
  if (ipMap.size > 2000) {
    ipMap.forEach((val, key) => {
      if (now > val.resetAt) {
        ipMap.delete(key);
      }
    });
  }

  const record = ipMap.get(identifier);

  if (!record || now > record.resetAt) {
    ipMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.round(windowMs / 1000) };
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetInSec: Math.max(1, Math.round((record.resetAt - now) / 1000)) 
    };
  }

  record.count += 1;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetInSec: Math.max(1, Math.round((record.resetAt - now) / 1000)) 
  };
}
