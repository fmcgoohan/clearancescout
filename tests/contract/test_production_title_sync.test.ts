import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { extractTitleFromScriptText } from '../../server/agents/ScriptParserAgent.js';

describe('Contract: User Story 24 - Persisted Production Title & Header Synchronization', () => {
  it('should extract title from Fountain/Plaintext screenplay text', () => {
    const text1 = `TITLE: THE NEON HORIZON\nAUTHOR: Team\n\nINT. PENTHOUSE - NIGHT\nAlex drinks Summit Cola.`;
    expect(extractTitleFromScriptText(text1)).toBe('The Neon Horizon');

    const text2 = `Title: Cyberfall\nAuthor: Jane Doe\n\nEXT. CITY - DAY\nCar drives by.`;
    expect(extractTitleFromScriptText(text2)).toBe('Cyberfall');
  });

  it('should update generic project title to extracted script title during screenplay upload', async () => {
    // 1. Create project with generic default title
    const createRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Production Project Workspace',
        productionCompany: 'Apex Entertainment',
        projectType: 'Movie',
        executionMode: 'TEST_MODE',
      });
    expect(createRes.status).toBe(201);
    const projectId = createRes.body.id;
    expect(createRes.body.title).toBe('Production Project Workspace');

    // 2. Upload screenplay with TITLE: Cyberfall
    const uploadRes = await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({
        scriptText: `TITLE: Cyberfall\n\nINT. LAB - DAY\nDr. Vance works at AeroTech Prism Laptop.`,
        format: 'PLAINTEXT',
      });
    expect(uploadRes.status).toBe(200);

    // 3. Verify GET /api/projects/:id reflects updated persisted title 'Cyberfall'
    const projRes = await request(app).get(`/api/projects/${projectId}`);
    expect(projRes.status).toBe(200);
    expect(projRes.body.title).toBe('Cyberfall');
  });

  it('should preserve explicit custom project title when provided by user', async () => {
    // 1. Create project with explicit title 'Cyberpunk Studio Demo'
    const createRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cyberpunk Studio Demo',
        productionCompany: 'Apex Entertainment',
        projectType: 'Movie',
        executionMode: 'TEST_MODE',
      });
    expect(createRes.status).toBe(201);
    const projectId = createRes.body.id;

    // 2. Upload script
    await request(app)
      .post(`/api/projects/${projectId}/script/upload`)
      .send({
        scriptText: `TITLE: THE NEON HORIZON\n\nINT. LAB - DAY\nAlex drinks Summit Cola.`,
        format: 'PLAINTEXT',
      });

    // 3. Explicit title must remain preserved
    const projRes = await request(app).get(`/api/projects/${projectId}`);
    expect(projRes.status).toBe(200);
    expect(projRes.body.title).toBe('Cyberpunk Studio Demo');
  });
});
