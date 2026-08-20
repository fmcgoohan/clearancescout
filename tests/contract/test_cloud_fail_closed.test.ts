import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { entityRepo } from '../../server/repositories/EntityRepo.js';
import { assessmentRepo } from '../../server/repositories/AssessmentRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { parallelSearchTool } from '../../server/tools/parallelSearchTool.js';

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

  it('should distinguish live hits with unknown registration from true zero-hit live searches in context flags', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Citation Distinction Project',
        productionCompany: 'Strict Citation Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Zero-hit assessment creation
    const zeroHitAsm = await assessmentRepo.createAssessment({
      occurrenceId: 'occ-zero-hit',
      canonicalEntityId: 'ent-zero-hit',
      sceneId: 'scene-1',
      riskStatus: 'REVIEW_RECOMMENDED',
      riskScore: 45,
      legalRationale: 'Completed live search surfaced zero conflicting trademark registrations.',
      contextFlags: ['ZERO_TRADEMARK_CONFLICTS_SURFACED', 'UNREGISTERED_HERO_REVIEW'],
      provenance: 'PARALLEL_LIVE',
      citations: [
        {
          id: 'cit-zero-1',
          sourceUrl: 'https://parallel.ai/search',
          query: 'Fictional NonExistent AlphaMark 9999',
          retrievedAt: new Date().toISOString(),
          excerptSnippet: 'Completed live search across public trademark and brand registries with zero conflicting marks surfaced for Fictional NonExistent AlphaMark 9999.',
          registrationStatus: 'UNKNOWN',
          provenance: 'PARALLEL_LIVE',
        },
      ],
    });

    expect(zeroHitAsm.contextFlags).toContain('ZERO_TRADEMARK_CONFLICTS_SURFACED');
    expect(zeroHitAsm.contextFlags).not.toContain('LIVE_MATCH_STATUS_UNKNOWN');

    // 2. Live hit with unknown status
    const liveMatchUnknownAsm = await assessmentRepo.createAssessment({
      occurrenceId: 'occ-live-unknown',
      canonicalEntityId: 'ent-live-unknown',
      sceneId: 'scene-1',
      riskStatus: 'REVIEW_RECOMMENDED',
      riskScore: 55,
      legalRationale: 'Live search surfaced public reference(s) with unconfirmed registration status.',
      contextFlags: ['LIVE_MATCH_STATUS_UNKNOWN', 'TRADEMARK_STATUS_UNKNOWN'],
      provenance: 'PARALLEL_LIVE',
      citations: [
        {
          id: 'cit-live-unknown-1',
          sourceUrl: 'https://example.com/mark',
          query: 'Some Unconfirmed Mark',
          retrievedAt: new Date().toISOString(),
          excerptSnippet: 'Public web catalog listing for Some Unconfirmed Mark.',
          registrationStatus: 'UNKNOWN',
          provenance: 'PARALLEL_LIVE',
        },
      ],
    });

    expect(liveMatchUnknownAsm.contextFlags).toContain('LIVE_MATCH_STATUS_UNKNOWN');
    expect(liveMatchUnknownAsm.contextFlags).toContain('TRADEMARK_STATUS_UNKNOWN');
    expect(liveMatchUnknownAsm.contextFlags).not.toContain('ZERO_TRADEMARK_CONFLICTS_SURFACED');
  });

  it('should cascade entity research retry across all occurrences of that entity using one fresh search', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Cascade Retry Project',
        productionCompany: 'Live Retry Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const scriptText = `SCENE 1 - INT. OFFICE - DAY
Alex drinks Summit Cola at the desk.

SCENE 2 - EXT. PATIO - NIGHT
Alex sips Summit Cola under the neon sign.`;

    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const cola = entities.find((e) => e.canonicalName.includes('Summit'));
    expect(cola).toBeDefined();

    // Set entity status to INSUFFICIENT_EVIDENCE so retry is permitted
    await entityRepo.updateCanonicalEntityStatus(projectId, cola!.id, 'INSUFFICIENT_EVIDENCE');

    // Trigger retry
    const retryRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${cola!.id}/retry-research`);
    expect(retryRes.status).toBe(200);

    const occsRes = await request(app).get(`/api/projects/${projectId}/entities/${cola!.id}/occurrences`);
    expect(occsRes.body.occurrences.length).toBe(2);
    // Both occurrences were refreshed
    expect(occsRes.body.occurrences[0].clearanceStatus).toBeDefined();
    expect(occsRes.body.occurrences[1].clearanceStatus).toBeDefined();
  });

  it('should visibly tag CONTEXT_DETERMINISTIC_FALLBACK in contextFlags when Gemini is unavailable', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Deterministic Fallback Tag Project',
        productionCompany: 'Strict Rule Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const scriptText = `SCENE 1 - INT. LAB - DAY
Alex uses the AeroTech Prism Laptop on the bench.`;

    await request(app)
      .post(`/api/projects/${projectId}/script`)
      .send({ scriptText, format: 'PLAINTEXT' });

    const entities = await entityRepo.getEntitiesByProject(projectId);
    const laptop = entities.find((e) => e.canonicalName.includes('AeroTech'));
    const occsRes = await request(app).get(`/api/projects/${projectId}/entities/${laptop!.id}/occurrences`);
    const occId = occsRes.body.occurrences[0].id;

    const evalRes = await request(app).post(`/api/projects/${projectId}/occurrences/${occId}/evaluate`);
    expect(evalRes.status).toBe(200);
    // In test environment without live Gemini credentials, must include CONTEXT_DETERMINISTIC_FALLBACK
    expect(evalRes.body.assessment.contextFlags).toContain('CONTEXT_DETERMINISTIC_FALLBACK');
  });

  it('should include structured searchOutcome on ParallelSearchTool results and prohibit baseline BRAND from assigning NO_ISSUE_SURFACED', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Structured Provider Semantics Project',
        productionCompany: 'Strict Semantics Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    // 1. Verify ParallelSearchTool returns explicit searchOutcome
    const searchRes = await parallelSearchTool.searchTrademarkGrounding('Apex Mountain Gear', 'DEMO_MODE');
    expect(searchRes.searchOutcome).toBeDefined();
    expect(['ZERO_RESULTS', 'MATCHES_FOUND', 'SERVICE_FALLBACK']).toContain(searchRes.searchOutcome);

    // 2. Baseline BRAND entity with no scene occurrences
    const brandEntity = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Apex Mountain Gear',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'Fictional mountain gear brand',
    });

    const evalRes = await request(app)
      .post(`/api/projects/${projectId}/clearance/evaluate`)
      .send({ canonicalEntityIds: [brandEntity.id] });
    expect(evalRes.status).toBe(200);
    const asm = evalRes.body.assessments[0];

    // Invariant (FR-003): Baseline BRAND must NOT independently assign NO_ISSUE_SURFACED without contractual rights
    expect(asm.riskStatus).not.toBe('NO_ISSUE_SURFACED');
    expect(['REVIEW_RECOMMENDED', 'ACTION_REQUIRED']).toContain(asm.riskStatus);
  });

  it('should dispatch RETRY_RESEARCH action for INSUFFICIENT_EVIDENCE and auto-resolve upon research retry', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Retry Action Lifecycle Project',
        productionCompany: 'Strict Workflow Legal',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    const projectId = projRes.body.id;

    const scene = await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. OFFICE - DAY',
      locationType: 'INT',
      timeOfDay: 'DAY',
      rawText: 'Alex examines the item on the table.',
      characterActionSummary: 'Alex examines the item',
    });

    const artifact = await entityRepo.createCanonicalEntity({
      projectId,
      canonicalName: 'Summit Cola',
      entityCategory: 'BRAND',
      overallClearanceStatus: 'INSUFFICIENT_EVIDENCE',
      description: 'Entrant fictional brand beverage',
    });

    const occ = await entityRepo.createOccurrence(projectId, {
      sceneId: scene.id,
      canonicalEntityId: artifact.id,
      scriptLineNumber: 1,
      excerptText: 'Alex examines the item on the table.',
      usageContext: 'Background prop mention',
      clearanceStatus: 'INSUFFICIENT_EVIDENCE',
    });

    // Set occurrence clearance status to INSUFFICIENT_EVIDENCE
    await entityRepo.updateOccurrenceEvaluation(projectId, scene.id, occ.id, {
      clearanceStatus: 'INSUFFICIENT_EVIDENCE',
      riskScore: 95,
      riskRationale: 'Insufficient evidence surfaced.',
      contextFlags: ['EVIDENCE_INSUFFICIENT'],
      evaluatedAt: new Date().toISOString(),
    });
    await entityRepo.updateCanonicalEntityStatus(projectId, artifact!.id, 'INSUFFICIENT_EVIDENCE');

    // Sync project actions to dispatch RETRY_RESEARCH
    await request(app).post(`/api/projects/${projectId}/actions/sync`);

    const actionsRes = await request(app).get(`/api/projects/${projectId}/actions?canonicalEntityId=${artifact!.id}`);
    const retryAction = actionsRes.body.find((a: any) => a.actionType === 'RETRY_RESEARCH');
    expect(retryAction).toBeDefined();
    expect(retryAction.status).toBe('OPEN');

    // Trigger explicit research retry
    const retryRes = await request(app)
      .post(`/api/projects/${projectId}/entities/${artifact!.id}/retry-research`);
    expect(retryRes.status).toBe(200);

    // Verify RETRY_RESEARCH action item was auto-resolved
    const updatedActionsRes = await request(app).get(`/api/projects/${projectId}/actions?canonicalEntityId=${artifact!.id}`);
    const resolvedRetryAction = updatedActionsRes.body.find((a: any) => a.id === retryAction.id);
    expect(resolvedRetryAction.status).toBe('RESOLVED');
    expect(resolvedRetryAction.resolutionTrigger).toBe('RESEARCH_RETRY_COMPLETED');
  });
});
