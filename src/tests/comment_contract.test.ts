import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Comment Contract API', () => {
  it('GET /api/tasks/:taskId/comments returns list of comments', async () => {
    const res = await request(app).get('/api/tasks/task-102/comments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  it('POST /api/tasks/:taskId/comments posts comment with @mentions', async () => {
    const res = await request(app)
      .post('/api/tasks/task-102/comments')
      .send({
        content: '@LegalCounsel please review trademark on prop graphic',
        authorName: 'Sarah Jenkins',
        authorRole: 'CLEARANCE_COORDINATOR',
        authorDepartment: 'LEGAL_COUNSEL',
      });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
    expect(res.body.comment.mentions).toContain('LegalCounsel');
  });

  it('DELETE /api/comments/:id marks comment as deleted', async () => {
    const postRes = await request(app)
      .post('/api/tasks/task-102/comments')
      .send({ content: 'Temporary comment' });

    const commentId = postRes.body.comment.id;
    const deleteRes = await request(app).delete(`/api/comments/${commentId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
