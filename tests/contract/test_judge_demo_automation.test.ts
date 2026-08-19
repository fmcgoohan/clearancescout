import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { assessmentRepo } from '../../server/repositories/AssessmentRepo.js';

describe('Contract: Feature 017 Judge-Ready 1-Click Demo Automation', () => {
  it('should ingest The Neon Horizon and auto-evaluate entities with DEMO_FIXTURE provenance without API keys', async () => {
    // 1. Create project in DEMO_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Judge Evaluation Project',
        productionCompany: 'Entrant Studio Team',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. 1-Click Demo Ingestion & Auto-Evaluation
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
    expect(demoRes.body.readinessSummary.totalScenes).toBeGreaterThanOrEqual(3);

    // 3. Verify Entities and Evaluations in Repository
    const entities = await entityRepo.getEntitiesByProject(projectId);
    expect(entities.length).toBeGreaterThanOrEqual(6);

    const summitEntity = entities.find((e) => e.canonicalName.includes('Summit Cola'));
    expect(summitEntity).toBeDefined();
    expect(summitEntity?.overallClearanceStatus).toBe('NO_ISSUE_SURFACED');

    const laptopEntity = entities.find((e) => e.canonicalName.includes('AeroTech'));
    expect(laptopEntity).toBeDefined();

    // Verify Citations contain DEMO_FIXTURE provenance
    const assessments = await assessmentRepo.getAssessmentsByEntity(projectId, summitEntity!.id);
    expect(assessments.length).toBeGreaterThanOrEqual(1);
    expect(assessments[0].provenance).toBe('DEMO_FIXTURE');
    expect(assessments[0].citations[0].provenance).toBe('DEMO_FIXTURE');

    // 4. Regression Test: Verify GET /api/projects/:id returns updated project summary counts for App header
    const projDetailRes = await request(app).get(`/api/projects/${projectId}`);
    expect(projDetailRes.status).toBe(200);
    expect(projDetailRes.body.entityCount).toBeGreaterThanOrEqual(6);
    expect(projDetailRes.body.clearedCount).toBeGreaterThanOrEqual(1);
    expect(projDetailRes.body.entityCount).toBe(entities.length);
  });
});
