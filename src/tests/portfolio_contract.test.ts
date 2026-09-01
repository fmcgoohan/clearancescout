import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Studio Portfolio API', () => {
  it('GET /api/portfolio returns studio production metrics', async () => {
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.portfolio)).toBe(true);
    expect(res.body.totalProjectsCount).toBeGreaterThan(0);
  });
});
