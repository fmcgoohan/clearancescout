import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index';

describe('Phase 4: Attachment Upload API', () => {
  it('GET /api/tasks/:taskId/attachments returns list of attachments', async () => {
    const res = await request(app).get('/api/tasks/task-104/attachments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });

  it('POST /api/tasks/:taskId/attachments returns signed upload URL and metadata', async () => {
    const res = await request(app)
      .post('/api/tasks/task-104/attachments')
      .send({
        fileName: 'Signed_License_Nocturne.pdf',
        fileSizeBytes: 1048576,
        mimeType: 'application/pdf',
        uploaderName: 'Legal Counsel',
      });

    expect(res.status).toBe(201);
    expect(res.body.attachment).toBeDefined();
    expect(res.body.uploadUrl).toBeDefined();
  });

  it('POST /api/tasks/:taskId/attachments enforces 25 MB file size limit', async () => {
    const res = await request(app)
      .post('/api/tasks/task-104/attachments')
      .send({
        fileName: 'huge_video.mp4',
        fileSizeBytes: 30000000, // > 25 MB
        mimeType: 'video/mp4',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('25 MB');
  });
});
