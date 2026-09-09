import { Request, Response, NextFunction } from 'express';

// In-memory request log: key (${bucket}:${clientIp}) -> timestamp array
const requestLog = new Map<string, number[]>();

/**
 * Extracts the client IP from the first hop of X-Forwarded-For header,
 * falling back to Express req.ip or socket remote address.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Resets the in-memory rate limit store (used in test teardown or administrative resets).
 */
export function resetRateLimits(): void {
  requestLog.clear();
}

/**
 * Creates an Express middleware that enforces sliding-window per-IP rate limits.
 *
 * @param bucket Identifier for the endpoint category (e.g. 'retry-research', 'project-create')
 * @param maxRequests Maximum allowed requests within windowMs
 * @param windowMs Time window in milliseconds (default: 10 minutes)
 */
export function createRateLimiter(bucket: string, maxRequests: number, windowMs = 10 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In unit/contract test environment, bypass unless rate limiting tests explicitly enable it
    if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_RATE_LIMIT_IN_TESTS) {
      return next();
    }

    const ip = getClientIp(req);
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (requestLog.get(key) || []).filter((ts) => ts > windowStart);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a few minutes.',
      });
    }

    timestamps.push(now);
    requestLog.set(key, timestamps);
    return next();
  };
}

// Pre-configured rate limiters per specification
export const demoSeedRateLimiter = createRateLimiter('demo-seed', 10);
export const scriptUploadRateLimiter = createRateLimiter('script-upload', 10);
export const retryResearchRateLimiter = createRateLimiter('retry-research', 10);
export const clearanceEvaluateRateLimiter = createRateLimiter('clearance-evaluate', 10);
export const projectCreateRateLimiter = createRateLimiter('project-create', 5);
