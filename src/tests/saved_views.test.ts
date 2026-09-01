import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Saved Views API', () => {
  it('GET /api/views returns saved filter view presets', async () => {
    const res = await request(app).get('/api/views?projectId=proj-default');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.views)).toBe(true);
  });

  it('POST /api/views creates and saves a new filter view preset', async () => {
    const res = await request(app)
      .post('/api/views')
      .send({
        name: 'My Overdue Blockers',
        isSharedWithTeam: true,
        isDefault: true,
        filters: { status: ['OPEN'], overdueOnly: true },
      });

    expect(res.status).toBe(201);
    expect(res.body.view).toBeDefined();
    expect(res.body.view.name).toBe('My Overdue Blockers');
  });
});
