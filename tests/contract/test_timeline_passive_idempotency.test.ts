import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';
import { timelineEmitter } from '../../server/events/timelineEmitter.js';

describe('Contract: Passive Timeline Idempotency (Feature 021)', () => {
  it('P0-5 & FR-015: ensures GET endpoints are side-effect-free and do not grow timeline event count', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Passive Timeline Test',
        productionCompany: 'Streamline Cinema',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Ingest a script to populate baseline events
    await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({
        scriptText: 'INT. CAFE - DAY\nAlice drinks Summit Cola.',
        format: 'PLAINTEXT',
      });

    // 3. Query baseline timeline history
    const initialTimelineRes = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(initialTimelineRes.status).toBe(200);
    const baselineCount = initialTimelineRes.body.events.length;
    expect(baselineCount).toBeGreaterThan(0);

    // 4. Repeatedly execute passive read operations
    for (let i = 0; i < 5; i++) {
      await request(app).get(`/api/projects/${projectId}`);
      await request(app).get(`/api/projects/${projectId}/scenes`);
      await request(app).get(`/api/projects/${projectId}/entities`);
      await request(app).get(`/api/projects/${projectId}/snapshot`);
      await request(app).get(`/api/projects/${projectId}/timeline`);
    }

    // 5. Verify timeline event count has not increased at all
    const afterPassiveRes = await request(app).get(`/api/projects/${projectId}/timeline`);
    expect(afterPassiveRes.status).toBe(200);
    expect(afterPassiveRes.body.events.length).toBe(baselineCount);

    // 6. Ensure all event IDs in history are strictly unique
    const ids = afterPassiveRes.body.events.map((e: any) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
