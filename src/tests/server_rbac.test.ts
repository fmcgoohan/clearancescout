import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Server RBAC Security API', () => {
  it('GET /api/admin/members returns project user roles', async () => {
    const res = await request(app).get('/api/admin/members?projectId=proj-default');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  it('POST /api/admin/members/assign-role rejects non-admin users with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/members/assign-role')
      .send({
        userId: 'usr-legal-1',
        projectRole: 'ADMINISTRATOR',
        requesterRole: 'ART_DEPT', // Non-admin requester
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access Denied');
  });
});
