import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Contract: Production Project Types & Listing (Feature 016 Phase 1)', () => {
  it('FR-001: creates projects with specified projectType (Movie, TV Show, Commercial) and defaults to Movie', async () => {
    // 1. Create Movie Project
    const movieRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Project Cyberfall',
        productionCompany: 'Apex Entertainment',
        scriptVersion: 'v1.0',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(movieRes.status).toBe(201);
    expect(movieRes.body.projectType).toBe('Movie');

    // 2. Create TV Show Project
    const tvRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'The Silicon Detective',
        productionCompany: 'Streaming Studios',
        scriptVersion: 'Pilot-Draft',
        projectType: 'TV Show',
        executionMode: 'DEMO_MODE',
      });
    expect(tvRes.status).toBe(201);
    expect(tvRes.body.projectType).toBe('TV Show');

    // 3. Create Commercial Project
    const commRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Glow Energy Drink Spot',
        productionCompany: 'AdWorks Global',
        scriptVersion: 'v3-Cut',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    expect(commRes.status).toBe(201);
    expect(commRes.body.projectType).toBe('Commercial');

    // 4. Create Project without projectType -> default to Movie
    const defaultRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Untitled Feature',
        productionCompany: 'Indie Pictures',
      });
    expect(defaultRes.status).toBe(201);
    expect(defaultRes.body.projectType).toBe('Movie');
  });

  it('rejects invalid projectType with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Invalid Type Project',
        productionCompany: 'Test Studio',
        projectType: 'Podcast',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid projectType');
  });

  it('GET /api/projects returns list of projects with clearance summary counts', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body.projects.length).toBeGreaterThan(0);

    const first = res.body.projects[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('projectType');
    expect(first).toHaveProperty('liveQuotaRemaining');
    expect(first).toHaveProperty('entityCount');
    expect(first).toHaveProperty('clearedCount');
    expect(first).toHaveProperty('actionRequiredCount');
  });
});
