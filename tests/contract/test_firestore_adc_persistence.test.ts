import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';
import { assessmentRepo } from '../../server/repositories/AssessmentRepo.js';
import { placeholderRepo } from '../../server/repositories/PlaceholderRepo.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { verifyFirestoreConnectivity } from '../../server/repositories/firestoreClient.js';

describe('Feature 019: Firestore Subcollection Path Standardization & Health Check', () => {
  let projectId: string;

  beforeEach(async () => {
    const proj = await projectRepo.createProject({
      title: 'Subcollection Path Test',
      productionCompany: 'Cloud Persistence Studios',
      scriptVersion: 'v1.0',
      executionMode: 'TEST_MODE',
    });
    projectId = proj.id;
  });

  it('verifies firestore client connectivity check returns connected: true in local environment', async () => {
    const check = await verifyFirestoreConnectivity();
    expect(check.connected).toBe(true);
  });

  it('GET /api/health returns HEALTHY status payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.credentials).toBeDefined();
  });

  it('persists and retrieves assessments using standardized project-scoped subcollections', async () => {
    const canonicalEntityId = 'ent-test-paths';
    const assessment = await assessmentRepo.createAssessment(projectId, {
      occurrenceId: 'occ-1',
      canonicalEntityId,
      sceneId: 'scene-1',
      riskStatus: 'REVIEW_RECOMMENDED',
      riskScore: 40,
      legalRationale: 'Test subcollection persistence.',
      contextFlags: ['BACKGROUND_PROP'],
      citations: [],
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.projectId).toBe(projectId);

    const retrieved = await assessmentRepo.getAssessmentsByEntity(projectId, canonicalEntityId);
    expect(retrieved.length).toBeGreaterThanOrEqual(1);
    expect(retrieved[0].canonicalEntityId).toBe(canonicalEntityId);
  });

  it('persists and queries placeholders using standardized subcollections', async () => {
    const canonicalEntityId = 'ent-prop-test';
    const placeholder = await placeholderRepo.createPlaceholder(projectId, {
      canonicalEntityId,
      canonicalName: 'Original Brand',
      assetCategory: 'BRAND',
      fictionalName: 'Fictional Brand Replacement',
      description: 'Test placeholder asset',
      clearanceTier: 'TEMP_APPROVED',
      creativeRationale: 'Safe non-infringing mark',
      approvedBy: 'Legal Counsel',
      approvalDate: new Date().toISOString(),
      scope: 'PROJECT_WIDE',
    });

    expect(placeholder.id).toBeDefined();
    expect(placeholder.projectId).toBe(projectId);

    const list = await placeholderRepo.getPlaceholdersByProject(projectId);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some(p => p.id === placeholder.id)).toBe(true);
  });
});
