import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Bulk Task Action Contract API', () => {
  it('POST /api/tasks/bulk-update processes batch task updates', async () => {
    const res = await request(app)
      .post('/api/tasks/bulk-update')
      .send({
        taskIds: ['task-101', 'task-102'],
        action: 'SET_ASSIGNEE',
        value: 'Sarah Jenkins',
        userRole: 'CLEARANCE_COORDINATOR',
      });

    expect(res.status).toBe(200);
    expect(res.body.succeeded).toContain('task-101');
    expect(res.body.succeeded).toContain('task-102');
  });

  it('POST /api/tasks/bulk-update reports partial failures when permission is denied', async () => {
    const res = await request(app)
      .post('/api/tasks/bulk-update')
      .send({
        taskIds: ['task-101'],
        action: 'SET_STATUS',
        value: 'RESOLVED',
        userRole: 'ART_DEPT', // Non-legal user attempting resolution
      });

    expect(res.status).toBe(403);
    expect(res.body.failed.length).toBeGreaterThan(0);
    expect(res.body.failed[0].reason).toContain('Legal Counsel');
  });
});
