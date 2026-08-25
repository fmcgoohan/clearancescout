// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { app } from '../../server/index.js';
import { projectRepo } from '../../server/repositories/ProjectRepo.js';
import { sceneRepo } from '../../server/repositories/SceneRepo.js';
import { BinderExportModal } from '../../src/components/BinderExportModal';

describe('Contract & Quality: User Story 23 - Trustworthy Visible Binder-Export Feedback', () => {
  it('AC-23.1: Preflight endpoint returns readiness metrics and blocks export when 0 scenes ingested', async () => {
    // 1. Create a project with scenes
    const projRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Preflight Success Project',
        productionCompany: 'Preflight Studio',
        projectType: 'Movie',
        executionMode: 'DEMO_MODE',
      });
    expect(projRes.status).toBe(201);
    const projectId = projRes.body.id;

    // Seed scene to give totalScenes > 0
    await sceneRepo.createScene({
      projectId,
      sceneNumber: 1,
      heading: 'INT. LEGAL OFFICE - DAY',
      rawText: 'INT. LEGAL OFFICE - DAY\nAlice signs the binder.',
      occurrences: [],
    });

    // Call preflight endpoint
    const pfRes = await request(app).get(`/api/projects/${projectId}/binder/preflight`);
    expect(pfRes.status).toBe(200);
    expect(pfRes.body.canExport).toBe(true);
    expect(pfRes.body.ready).toBe(true);
    expect(pfRes.body.totalScenes).toBeGreaterThan(0);
    expect(pfRes.body.estimatedSize).toBeDefined();

    // 2. Create an empty project (0 scenes)
    const emptyProjRes = await request(app)
      .post('/api/projects')
      .send({
        title: 'Empty Screenplay Project',
        productionCompany: 'Empty Studio',
        projectType: 'Movie',
        executionMode: 'TEST_MODE',
      });
    const emptyProjId = emptyProjRes.body.id;

    const emptyPfRes = await request(app).get(`/api/projects/${emptyProjId}/binder/preflight`);
    expect(emptyPfRes.status).toBe(200);
    expect(emptyPfRes.body.canExport).toBe(false);
    expect(emptyPfRes.body.reason).toContain('No screenplay has been ingested yet');
  });

  it('AC-23.2, AC-23.3, AC-23.4: BinderExportModal renders processing states, filename confirmation, and error/retry states', async () => {
    // 1. Test Processing State (PREFLIGHT_CHECKING / PROCESSING)
    const { rerender } = render(
      <BinderExportModal
        binder={null}
        isOpen={true}
        onClose={vi.fn()}
        exportState="PROCESSING"
      />
    );

    const statusEl = screen.getByRole('status');
    expect(statusEl).toBeDefined();
    expect(screen.getByText(/Compiling production clearance binder payload.../i)).toBeDefined();

    // 2. Test Failure State with Error & Retry button
    const onRetryMock = vi.fn();
    rerender(
      <BinderExportModal
        binder={null}
        isOpen={true}
        onClose={vi.fn()}
        exportState="FAILURE"
        exportError="Network connection lost during compilation"
        onRetry={onRetryMock}
      />
    );

    expect(screen.getByText(/Network connection lost during compilation/i)).toBeDefined();
    const retryBtn = screen.getByText(/Retry Export/i);
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(onRetryMock).toHaveBeenCalledTimes(1);

    // 3. Test Success State with Filename & File Size Confirmation (AC-23.3)
    const mockBinder = {
      id: 'bnd-999',
      projectId: 'proj-123',
      projectSummary: {
        title: 'Neon Horizon',
        productionCompany: 'Cyber Studios',
        scriptVersion: 'V2',
        totalScenes: 5,
        totalEntities: 10,
        clearedCount: 8,
        actionRequiredCount: 2,
        reviewRecommendedCount: 0,
        overridesCount: 1,
      },
      scenes: [],
      canonicalEntities: [],
      citationsIndex: [],
      replacementCatalog: [],
      overridesHistory: [],
      exportedAt: '2026-08-25T00:00:00Z',
      integrityDigest: 'sha256-abcdef1234567890',
      disclaimer: 'For internal legal use only.',
    };

    rerender(
      <BinderExportModal
        binder={mockBinder as any}
        isOpen={true}
        onClose={vi.fn()}
        exportState="SUCCESS"
      />
    );

    expect(screen.getByText(/Generated Binder Artifact Confirmed/i)).toBeDefined();
    expect(screen.getAllByText(/Clearance_Binder_Neon_Horizon_bnd-999.json/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sha256-abcdef1234567890/i)).toBeDefined();
  });
});
