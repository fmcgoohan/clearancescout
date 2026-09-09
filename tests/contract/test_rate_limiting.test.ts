import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { resetRateLimits } from '../../server/middleware/rateLimitMiddleware.js';

describe('Contract: In-Memory Per-IP Rate Limiting', () => {
  beforeEach(() => {
    process.env.ENABLE_RATE_LIMIT_IN_TESTS = 'true';
    resetRateLimits();
  });

  it('limits project creation to 5 per 10 minutes per IP, returning HTTP 429 on 6th request', async () => {
    const clientIp = '198.51.100.15';

    for (let i = 1; i <= 5; i++) {
      const res = await request(app)
        .post('/api/projects')
        .set('x-forwarded-for', `${clientIp}, 10.0.0.1`)
        .send({
          title: `Rate Limit Test Project ${i}`,
          productionCompany: 'Test Studio',
          projectType: 'Movie',
        });
      expect(res.status).toBe(201);
    }

    // 6th request from same IP must be rate limited with HTTP 429
    const limitedRes = await request(app)
      .post('/api/projects')
      .set('x-forwarded-for', `${clientIp}, 10.0.0.1`)
      .send({
        title: 'Rate Limit Test Project 6',
        productionCompany: 'Test Studio',
        projectType: 'Movie',
      });

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body).toEqual({
      error: 'Rate limit reached. Please wait a few minutes.',
    });

    // A different IP is not affected
    const diffIpRes = await request(app)
      .post('/api/projects')
      .set('x-forwarded-for', '198.51.100.99, 10.0.0.1')
      .send({
        title: 'Different IP Project',
        productionCompany: 'Test Studio',
        projectType: 'Movie',
      });
    expect(diffIpRes.status).toBe(201);
  });

  it('limits retry-research to 10 per 10 minutes per IP, returning HTTP 429 on 11th request', async () => {
    const clientIp = '203.0.113.42';

    // First create a project to test against
    const projRes = await request(app)
      .post('/api/projects')
      .set('x-forwarded-for', '192.0.2.1')
      .send({
        title: 'Retry Rate Limit Test Project',
        productionCompany: 'Test Studio',
        projectType: 'Movie',
      });
    const projectId = projRes.body.id;

    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post(`/api/projects/${projectId}/entities/ent-nonexistent-${i}/retry-research`)
        .set('x-forwarded-for', `${clientIp}, 10.0.0.2`);
      // It passes the rate limiter (handler returns 404/500/200, but definitely NOT 429)
      expect(res.status).not.toBe(429);
    }

    // 11th request must return 429
    const limitedRes = await request(app)
      .post(`/api/projects/${projectId}/entities/ent-nonexistent-11/retry-research`)
      .set('x-forwarded-for', `${clientIp}, 10.0.0.2`);

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.body).toEqual({
      error: 'Rate limit reached. Please wait a few minutes.',
    });
  });
});
