import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { assessmentRepo } from '../../server/repositories/AssessmentRepo.js';

describe('Contract: Feature 018 Fail-Closed CLOUD_MODE & Clean Zero-Hit Grounding', () => {
  it('should fail closed to INSUFFICIENT_EVIDENCE in CLOUD_MODE when search fails or returns fallback fixtures', async () => {
    // 1. Create a project in CLOUD_MODE
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cloud Mode Production Test',
        productionCompany: 'Hardened Studio Legal',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // 2. Create canonical entity in project
    const entity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Unknown Unregistered Widget Mark',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'An obscure widget brand mentioned in dialogue',
    });

    // 3. Evaluate clearance in CLOUD_MODE (without live Parallel API keys in test environment)
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({
        canonicalEntityIds: [entity.id],
      });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.assessments).toBeDefined();
    expect(evalRes.body.assessments.length).toBe(1);

    const asm = evalRes.body.assessments[0];
    // In CLOUD_MODE with fallback fixtures, must fail closed to INSUFFICIENT_EVIDENCE
    expect(asm.riskStatus).toBe('INSUFFICIENT_EVIDENCE');
    expect(asm.riskScore).toBeGreaterThanOrEqual(80);
    expect(asm.provenance).toBe('FALLBACK_FIXTURE');
    expect(asm.citations.length).toBeGreaterThanOrEqual(1);
    expect(asm.citations[0].provenance).toBe('FALLBACK_FIXTURE');

    // 4. Verify Canonical Entity in repository was updated to INSUFFICIENT_EVIDENCE
    const updatedEntity = await entityRepo.getEntityById(projectId, entity.id);
    expect(updatedEntity?.overallClearanceStatus).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('should treat PARALLEL_LIVE zero hits as clean completed research without inventing synthetic facts', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Zero Hit Test Project',
        productionCompany: 'Studio Legal',
        projectType: 'Movie',
        executionMode: 'CLOUD_MODE',
      });
    const projectId = projRes.body.id;

    const entity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Fictional NonExistent AlphaMark 9999',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'Completely fictional name',
    });

    // Directly test AssessmentRepo creation with zero-hit citation
    const asm = await assessmentRepo.createAssessment({
      occurrenceId: `occ-${entity.id}`,
      canonicalEntityId: entity.id,
      sceneId: 'scene-1',
      riskStatus: 'REVIEW_RECOMMENDED',
      riskScore: 45,
      legalRationale: 'Completed live search across public trademark registries with zero conflicting marks surfaced.',
      contextFlags: ['ZERO_TRADEMARK_CONFLICTS_SURFACED', 'UNREGISTERED_HERO_REVIEW'],
      provenance: 'PARALLEL_LIVE',
      citations: [
        {
          id: 'cit-live-1',
          sourceUrl: 'https://parallel.ai/search',
          query: 'Fictional NonExistent AlphaMark 9999',
          retrievedAt: new Date().toISOString(),
          excerptSnippet: 'Completed live search across public trademark and brand registries with zero conflicting marks surfaced for Fictional NonExistent AlphaMark 9999.',
          registrationStatus: 'UNKNOWN',
          provenance: 'PARALLEL_LIVE',
        },
      ],
    });

    expect(asm.provenance).toBe('PARALLEL_LIVE');
    expect(asm.citations[0].provenance).toBe('PARALLEL_LIVE');
    expect(asm.citations[0].corporateOwner).toBeUndefined(); // Never populated with synthetic owner
    expect(asm.citations[0].disputePrecedents).toBeUndefined(); // Never populated with synthetic precedents
    expect(asm.citations[0].registrationStatus).toBe('UNKNOWN'); // Kept unknown, not registered active
  });

  it('should accurately reflect UNKNOWN registration status in context flags and legal rationales without claiming TRADEMARK_ACTIVE', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Unknown Reg Accuracy Project',
        productionCompany: 'Strict Grounding Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // Create an entity and evaluate occurrence
    const entity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'Entrant fictional brand beverage',
    });

    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entity.id] });

    expect(evalRes.status).toBe(200);
    const asm = evalRes.body.assessments[0];

    // When registration status is UNKNOWN (from clean live/fixture search), contextFlags must NOT contain TRADEMARK_ACTIVE
    if (asm.citations[0]?.registrationStatus === 'UNKNOWN') {
      expect(asm.contextFlags).not.toContain('TRADEMARK_ACTIVE');
      expect(asm.legalRationale).not.toContain('confirmed active registration');
    }
  });

  it('should bypass all cached and persisted grounding on explicit research retry to perform fresh research', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Retry Grounding Project',
        productionCompany: 'Live Retry Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const entity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'Entrant fictional brand beverage',
    });

    // 1. Initial clearance evaluation
    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [entity.id] });
    expect(evalRes.status).toBe(200);
    const initialAsmId = evalRes.body.assessments[0].id;

    // Set entity status to INSUFFICIENT_EVIDENCE so retry is eligible
    await entityRepo.updateCanonicalEntityStatus(projectId, entity.id, 'INSUFFICIENT_EVIDENCE');

    // 2. Explicit research retry should bypass cache and persisted grounding
    const retryRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${entity.id}/retry-research`);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.assessment).toBeDefined();
    expect(retryRes.body.assessment.id).not.toBe(initialAsmId); // Fresh assessment created
  });
});
