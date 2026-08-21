import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Contract: Ingestion Lifecycle & Atomic Snapshot Refresh (Feature 021)', () => {
  it('P0-1 & FR-001: returns complete atomic snapshot on GET /api/projects/:id/snapshot and after ingestion', async () => {
    // 1. Create a project
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Snapshot Verification Film',
        productionCompany: 'Integrity Media',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Initial empty snapshot should have 0 scenes, 0 entities, 0 actions
    const initSnapshotRes = await request(app).get(`/api/projects/${projectId}/snapshot`);
    expect(initSnapshotRes.status).toBe(200);
    expect(initSnapshotRes.body.scenes).toHaveLength(0);
    expect(initSnapshotRes.body.entities).toHaveLength(0);
    expect(initSnapshotRes.body.project.totalScenes).toBe(0);
    expect(initSnapshotRes.body.project.totalActiveEntities).toBe(0);

    // 3. Ingest a 3-scene screenplay
    const sampleScript = `
INT. DINER - DAY

ALICE drinks a Summit Cola and checks her Apple iPhone.

EXT. PARKING LOT - DAY

BOB gets into a Porsche 911.

INT. CAFE - NIGHT

ALICE and BOB discuss Nike shoes.
    `.trim();

    const uploadRes = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({
        scriptText: sampleScript,
        format: 'PLAINTEXT',
      });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.scenesCount).toBe(3);
    expect(uploadRes.body.snapshot).toBeDefined();
    expect(uploadRes.body.snapshot.scenes).toHaveLength(3);
    expect(uploadRes.body.snapshot.entities.length).toBeGreaterThan(0);
    expect(uploadRes.body.snapshot.project.totalScenes).toBe(3);
    expect(uploadRes.body.snapshot.project.totalActiveEntities).toBe(uploadRes.body.snapshot.entities.length);

    // 4. GET /snapshot should match the atomic snapshot perfectly
    const postSnapshotRes = await request(app).get(`/api/projects/${projectId}/snapshot`);
    expect(postSnapshotRes.status).toBe(200);
    expect(postSnapshotRes.body.scenes).toHaveLength(3);
    expect(postSnapshotRes.body.entities).toHaveLength(uploadRes.body.snapshot.entities.length);
    expect(postSnapshotRes.body.snapshotTimestamp).toBeDefined();
  });
});
