import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

/**
 * Demo Access Token Authorization Middleware
 *
 * Enforces shared demo token verification for mutating writes and clearance research endpoints.
 * - If DEMO_ACCESS_TOKEN is unset or empty, auth is completely bypassed (open local dev).
 * - If set, requests must provide a matching token via:
 *    1. x-demo-token header
 *    2. Authorization: Bearer <token> header
 *    3. ?token=<token> or ?demoToken=<token> query parameter
 * - Invalid or missing tokens fail visibly with HTTP 401 and zero secret disclosure.
 */
export function demoAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const isCloudMode = config.executionMode === 'CLOUD_MODE' || process.env.EXECUTION_MODE === 'CLOUD_MODE';

  // Public exemptions for judge evaluation and container probes
  if (
    req.path === '/health' ||
    req.path.endsWith('/health') ||
    req.path === '/api/health' ||
    req.path.endsWith('/script/demo') ||
    req.path.includes('/fixtures/')
  ) {
    return next();
  }

  const requiredToken = config.demoAccessToken?.trim();

  // In CLOUD_MODE: fail closed. Mutating write/AI and project data endpoints require a configured server token
  if (isCloudMode) {
    if (!requiredToken) {
      return res.status(401).json({
        error: 'Unauthorized: Production live runtime in CLOUD_MODE requires a configured DEMO_ACCESS_TOKEN.',
      });
    }
  } else {
    // In TEST_MODE / DEMO_MODE, allow open local dev if no token configured
    if (!requiredToken) {
      return next();
    }
  }

  // Extract token from header, Authorization Bearer, or query param
  const headerToken = req.headers['x-demo-token'] as string | undefined;
  
  const authHeader = req.headers['authorization'];
  let bearerToken: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const queryToken = (req.query.token || req.query.demoToken) as string | undefined;

  const providedToken = (headerToken || bearerToken || queryToken || '').trim();

  if (!providedToken || providedToken !== requiredToken) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing demo access token.',
    });
  }

  return next();
}
