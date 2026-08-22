import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { rightsRepo } from '../../server/repositories/RightsRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';
import { actionNotificationRepo } from '../../server/repositories/ActionNotificationRepo.js';

describe('Integration: Judge-Ready 1-Click Demo Workflow & Invariant Preservation (Feature 017)', () => {
  it('should execute end-to-end demo screenplay ingestion, auto-evaluation, populated dashboard, and binder export with SHA-256 seal', async () => {
    // 1. Create a Movie project in DEMO_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'ClearanceScout Production Clearance Studio',
        productionCompany: 'Entrant Studio Team',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Perform 1-Click Demo Screenplay Ingestion & Auto-Evaluation
    const demoRes = await request(app)
      .post(`/api/projects/${projectId}/script/demo`)
      .send({
        autoEvaluate: true,
        includeSampleRights: true,
        includeSamplePlaceholders: true,
      });

    expect(demoRes.status).toBe(200);
    expect(demoRes.body.projectId).toBe(projectId);
    expect(demoRes.body.provenance).toBe('DEMO_FIXTURE');
    expect(demoRes.body.scenesCount).toBeGreaterThanOrEqual(3);
    expect(demoRes.body.entitiesCount).toBeGreaterThanOrEqual(6);
    expect(demoRes.body.evaluationsCount).toBeGreaterThanOrEqual(6);
    expect(demoRes.body.activeRightsCount).toBe(1);
    expect(demoRes.body.activePlaceholdersCount).toBe(1);
    expect(demoRes.body.readinessSummary.overallReadinessPercentage).toBeGreaterThanOrEqual(25);

    // 3. Verify Canonical Entities in Repository have evaluated clearance statuses
    const entities = await entityRepo.getEntitiesByProject(projectId);
    expect(entities.length).toBeGreaterThanOrEqual(6);

    const summitEntity = entities.find((e) => e.canonicalName.includes('Summit Cola'));
    const laptopEntity = entities.find((e) => e.canonicalName.includes('AeroTech'));
    const veloceEntity = entities.find((e) => e.canonicalName.includes('Veloce GT'));

    expect(summitEntity).toBeDefined();
    expect(laptopEntity).toBeDefined();
    expect(veloceEntity).toBeDefined();
    expect(summitEntity?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');
    expect(veloceEntity?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    // 4. Verify Attached Rights Agreement (Summit Beverage Group LLC)
    const rights = await rightsRepo.getRightsByProject(projectId);
    expect(rights.length).toBeGreaterThanOrEqual(1);
    expect(rights[0].licensorName).toBe('Summit Beverage Group LLC');
    expect(rights[0].status).toBe('ACTIVE');

    // 5. Verify Attached Fictional Prop Placeholder (NovaTech Zenith)
    const placeholders = await placeholderRepo.getPlaceholdersByProject(projectId);
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
    expect(placeholders[0].fictionalName).toBe('NovaTech Zenith');
    expect(placeholders[0].clearanceTier).toBe('TEMP_APPROVED');

    // 6. Verify Production Operations Dashboard
    const dashRes = await request(app).get(`/api/projects/${projectId}/dashboard`);
    expect(dashRes.status).toBe(200);
    const dash = dashRes.body;
    expect(dash.projectTitle).toBe('ClearanceScout Production Clearance Studio');
    expect(dash.kpis.readinessPercentage).toBeGreaterThanOrEqual(25);
    expect(dash.kpis.totalScenes).toBeGreaterThanOrEqual(3);
    expect(dash.kpis.totalEntities).toBeGreaterThanOrEqual(6);
    expect(dash.activePlaceholders.length).toBeGreaterThanOrEqual(1);
    expect(dash.sceneReadinessDistribution.length).toBeGreaterThanOrEqual(3);

    // 7. Verify Legal Clearance Binder Export with SHA-256 Digest
    const binderRes = await request(app).post(`/api/projects/${projectId}/binder/export`);
    expect(binderRes.status).toBe(200);
    const binder = binderRes.body;

    expect(binder.id).toMatch(/^bnd-/);
    expect(binder.projectId).toBe(projectId);
    expect(binder.integrityDigest).toBeDefined();
    expect(binder.integrityDigest.length).toBe(64);
    expect(binder.disclaimer).toContain('does NOT render formal legal advice');
    expect(binder.rightsAgreements.length).toBeGreaterThanOrEqual(1);
    expect(binder.placeholders.length).toBeGreaterThanOrEqual(1);
    expect(binder.sceneReadinessSchedule.length).toBeGreaterThanOrEqual(3);

    // 8. Verify Downloadable Markdown Export
    const mdRes = await request(app).get(`/api/projects/${projectId}/binder/markdown`);
    expect(mdRes.status).toBe(200);
    expect(mdRes.headers['content-type']).toContain('text/markdown');
    expect(mdRes.text).toContain('# Production Legal Clearance Binder');
    expect(mdRes.text).toContain(binder.integrityDigest);
    expect(mdRes.text).toContain('Summit Beverage Group LLC');
    expect(mdRes.text).toContain('NovaTech Zenith');
  });

  it('T017: populates non-zero evaluations and authentic provenance in CLOUD_MODE 1-click demo', async () => {
    const { config } = await import('../../server/config.js');
    const { scriptParserAgent } = await import('../../server/agents/ScriptParserAgent.js');
    const origMode = config.executionMode;
    const origToken = config.demoAccessToken;
    const origGemini = config.geminiApiKey;
    const origParallel = config.parallelWebApiKey;
    const parserSpy = vi.spyOn(scriptParserAgent, 'parseScriptText').mockImplementation(async (text: string) => {
      return (scriptParserAgent as any).parseScriptFallback(text);
    });

    try {
      config.executionMode = 'CLOUD_MODE';
      config.demoAccessToken = 'judge-pass-2026';
      config.geminiApiKey = undefined;
      config.parallelWebApiKey = undefined;

      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer judge-pass-2026')
        .send({
          title: 'Cloud Mode Demo Test',
          productionCompany: 'Entrant Studio Team',
          projectType: 'Movie',
          executionMode: 'CLOUD_MODE',
        });
      expect(projRes.status).toBe(201);
      const projectId = projRes.body.id;

      const demoRes = await request(app)
        .post(`/api/projects/${projectId}/script/demo`)
        .set('Authorization', 'Bearer judge-pass-2026')
        .send({
          autoEvaluate: true,
        });

      expect(demoRes.status).toBe(200);
      expect(demoRes.body.scenesCount).toBeGreaterThanOrEqual(3);
      expect(demoRes.body.entitiesCount).toBeGreaterThanOrEqual(6);
      expect(demoRes.body.evaluationsCount).toBeGreaterThan(0);
      expect(demoRes.body.readinessSummary).toBeDefined();
    } finally {
      parserSpy.mockRestore();
      config.executionMode = origMode;
      config.demoAccessToken = origToken;
      config.geminiApiKey = origGemini;
      config.parallelWebApiKey = origParallel;
    }
  });
});
