import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Integration: Production Projects Lifecycle (Feature 016 Phase 1)', () => {
  it('creates diverse production formats (Movie, TV Show, Commercial), retrieves list with clearance rollups, and inspects workspace summary', async () => {
    // 1. Create Movie Project
    const movieRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberfall 2099',
        productionCompany: 'Apex Pictures',
        scriptVersion: 'v1.0-Shooting',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(movieRes.status).toBe(201);
    const movieProjectId = movieRes.body.id;
    expect(movieRes.body.projectType).toBe('Movie');

    // 2. Create TV Show Project
    const tvRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Neon Underground: Season 1',
        productionCompany: 'Apex Streaming',
        scriptVersion: 'Episode101-Final',
        projectType: 'TV Show',
        executionMode: 'DEMO_MODE',
      });
    expect(tvRes.status).toBe(201);
    const tvProjectId = tvRes.body.id;
    expect(tvRes.body.projectType).toBe('TV Show');

    // 3. Create Commercial Project
    const commRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Volt Energy 30s Super Bowl',
        productionCompany: 'Volt Brand Ops',
        scriptVersion: '30s-DirectorCut',
        projectType: 'Commercial',
        executionMode: 'DEMO_MODE',
      });
    expect(commRes.status).toBe(201);
    const commProjectId = commRes.body.id;
    expect(commRes.body.projectType).toBe('Commercial');

    // 4. Add entities to the TV Show Project
    const entity1Res = await request(app)
      .post(`/api/projects/${tvProjectId}/entities`)
      .send({
        canonicalName: 'OmniCorp Holographics',
        entityCategory: 'BRAND',
        description: 'Fictional cybernetic hardware manufacturer in episode 1.',
      });
    expect(entity1Res.status).toBe(201);

    const entity2Res = await request(app)
      .post(`/api/projects/${tvProjectId}/entities`)
      .send({
        canonicalName: 'Starlight Lounge Track',
        entityCategory: 'ART_MUSIC',
        description: 'Background jazz track in lounge scene.',
      });
    expect(entity2Res.status).toBe(201);

    // 5. Query GET /api/projects directory
    const listRes = await request(app).get('/api/projects');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.projects)).toBe(true);

    const tvInList = listRes.body.projects.find((p: any) => p.id === tvProjectId);
    expect(tvInList).toBeDefined();
    expect(tvInList.projectType).toBe('TV Show');
    expect(tvInList.entityCount).toBe(2);

    const movieInList = listRes.body.projects.find((p: any) => p.id === movieProjectId);
    expect(movieInList).toBeDefined();
    expect(movieInList.projectType).toBe('Movie');

    const commInList = listRes.body.projects.find((p: any) => p.id === commProjectId);
    expect(commInList).toBeDefined();
    expect(commInList.projectType).toBe('Commercial');

    // 6. Query GET /api/projects/:id for TV Show workspace landing summary
    const tvDetailRes = await request(app).get(`/api/projects/${tvProjectId}`);
    expect(tvDetailRes.status).toBe(200);
    expect(tvDetailRes.body.title).toBe('Neon Underground: Season 1');
    expect(tvDetailRes.body.projectType).toBe('TV Show');
    expect(tvDetailRes.body.entityCount).toBe(2);
    expect(tvDetailRes.body.clearedCount).toBe(0);
    expect(tvDetailRes.body.actionRequiredCount).toBe(0);
  });
});
