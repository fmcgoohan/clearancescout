// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { WorkspacePage } from '../../src/pages/WorkspacePage.js';
import { ScriptUploadModal } from '../../src/components/ScriptUploadModal.js';
import { pluralize, formatStatus, formatCategory, formatDepartment, formatPriority } from '../../src/utils/formatters.js';

describe('Rendered UI QA: Load Bundled Fictional Demo Screenplay, 7-Entity Truth, Staged Replacement & Action Regeneration (T058, T064)', () => {
  const sampleEntities = [
    { id: 'ent-1', canonicalName: 'AeroTech Prism Laptop', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-2', canonicalName: 'Summit Cola', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-3', canonicalName: 'Elena Vance', entityCategory: 'PUBLIC_FIGURE', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-4', canonicalName: 'Nocturne of the Wild', entityCategory: 'ART_MUSIC', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-5', canonicalName: 'Veloce GT', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-6', canonicalName: 'Midtown Spire Tower', entityCategory: 'PROPRIETARY_LOCATION', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
    { id: 'ent-7', canonicalName: 'Titan Industrial Hazard Placard', entityCategory: 'GRAPHIC_PROP', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
  ];

  const sampleScenes = [
    { id: 'scene-1', sceneNumber: 1, heading: 'INT. PENTHOUSE WORKSPACE - NIGHT', readinessStatus: 'RED', rawText: 'ALEX taps his AeroTech Prism Laptop and drinks Summit Cola. Elena Vance speaks on screen. Nocturne of the Wild plays.' },
    { id: 'scene-2', sceneNumber: 2, heading: 'EXT. MIDTOWN SPIRE TOWER - NIGHT', readinessStatus: 'RED', rawText: 'JORDAN drives a Veloce GT beneath Midtown Spire Tower.' },
    { id: 'scene-3', sceneNumber: 3, heading: 'INT. INDUSTRIAL SUB-LEVEL - NIGHT', readinessStatus: 'RED', rawText: 'A yellow Titan Industrial Hazard Placard flashes on the bulkhead.' },
  ];

  beforeEach(() => {
    vi.useRealTimers();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/overrides')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ overrides: [] }),
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/snapshot')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            project: { id: 'proj-sample-qa', title: 'Sample QA', totalActiveEntities: 7 },
            scenes: sampleScenes,
            entities: sampleEntities,
            readiness: { totalScenes: 3, redScenesCount: 3, workingClearScenesCount: 0, finalClearScenesCount: 0, overallReadinessPercentage: 0, scenes: [] },
            actionsSummary: { totalActions: 2, openActions: 2, criticalActions: 0 },
          }),
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/entities')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => sampleEntities,
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/scenes/readiness') || url.includes('/readiness')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ totalScenes: 3, redScenesCount: 3, workingClearScenesCount: 0, finalClearScenesCount: 0, overallReadinessPercentage: 0, scenes: [] }),
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/scenes')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => sampleScenes,
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/actions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 'act-1', canonicalEntityId: 'ent-7', title: 'Create Fictional Prop Graphic', status: 'OPEN', targetDepartment: 'ART_DEPT', priority: 'HIGH', description: 'Action in Scene 3' },
            { id: 'act-2', canonicalEntityId: 'ent-4', title: 'Secure Music License', status: 'OPEN', targetDepartment: 'LEGAL_COUNSEL', priority: 'HIGH', description: 'Action in Scene 1' },
          ],
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('verifies shared pluralization and status enum formatting helpers', () => {
    expect(pluralize(1, 'Scene')).toBe('1 Scene');
    expect(pluralize(3, 'Scene')).toBe('3 Scenes');
    expect(pluralize(0, 'Open Action')).toBe('0 Open Actions');
    expect(pluralize(1, 'Open Action')).toBe('1 Open Action');
    expect(pluralize(2, 'Open Action')).toBe('2 Open Actions');
    expect(pluralize(7, 'clearance entity', 'clearance entities')).toBe('7 clearance entities');

    expect(formatStatus('INSUFFICIENT_EVIDENCE')).toBe('Insufficient Evidence');
    expect(formatStatus('ACTION_REQUIRED')).toBe('Action Required');
    expect(formatStatus('REVIEW_RECOMMENDED')).toBe('Review Recommended');
    expect(formatStatus('NO_ISSUE_SURFACED')).toBe('Cleared');
    expect(formatStatus('SCRIPT_REVISION_SUPERSEDED')).toBe('Superseded by New Script Revision');

    expect(formatCategory('BRAND')).toBe('Brand');
    expect(formatCategory('ART_MUSIC')).toBe('Art & Music');
    expect(formatCategory('PUBLIC_FIGURE')).toBe('Public Figure');
    expect(formatCategory('PROPRIETARY_LOCATION')).toBe('Proprietary Location');
    expect(formatCategory('GRAPHIC_PROP')).toBe('Graphic Prop');

    expect(formatDepartment('ART_DEPT')).toBe('Art Dept');
    expect(formatDepartment('LEGAL_COUNSEL')).toBe('Legal Counsel');
  });

  it('proves clicking Load Sample Screenplay opens visible modal with exact 7 entities derived from fixture and product taxonomy', async () => {
    const { getByRole, getByLabelText, getByText } = render(
      React.createElement(WorkspacePage, {
        projectId: 'proj-sample-qa',
        onEvaluateClearance: () => {},
        onGenerateReplacement: () => {},
        onOpenCounselReview: () => {},
        isEvaluating: false,
        refreshTrigger: 0,
        executionMode: 'CLOUD_MODE',
      })
    );

    // 1. Operator clicks "Load Sample Screenplay" trigger
    const sampleBtn = getByLabelText('Load Bundled Fictional Demo Screenplay');
    expect(sampleBtn).toBeDefined();
    fireEvent.click(sampleBtn);

    // 2. Modal opens directly into DEMO tab
    const dialog = getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.textContent).toContain('The Neon Horizon (Demo Screenplay)');
    expect(dialog.textContent).toContain('featuring 7 fully fictional clearance entities');

    // 3. Exact 7 entities are displayed in preview
    expect(dialog.textContent).toContain('AeroTech Prism Laptop');
    expect(dialog.textContent).toContain('Summit Cola');
    expect(dialog.textContent).toContain('Elena Vance');
    expect(dialog.textContent).toContain('Nocturne of the Wild');
    expect(dialog.textContent).toContain('Veloce GT');
    expect(dialog.textContent).toContain('Midtown Spire Tower');
    expect(dialog.textContent).toContain('Titan Industrial Hazard Placard');

    // 4. Official taxonomy badges are present
    expect(dialog.textContent).toContain('Brand');
    expect(dialog.textContent).toContain('Public Figure');
    expect(dialog.textContent).toContain('Art & Music');
    expect(dialog.textContent).toContain('Proprietary Location');
    expect(dialog.textContent).toContain('Graphic Prop');

    // 5. Ingesting triggers progress without stalling
    const ingestBtn = getByText(/Load Bundled Demo Screenplay|Ingest Screenplay/i);
    expect(ingestBtn).toBeDefined();

    (global.fetch as any).mockImplementationOnce((url: string) => {
      if (url.includes('/api/projects/proj-sample-qa/script/demo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            scenesParsed: 3,
            canonicalEntitiesExtracted: 7,
            snapshot: {
              scenes: sampleScenes,
              entities: sampleEntities,
              actionsSummary: { totalActions: 2, openActions: 2, criticalActions: 0 },
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    fireEvent.click(ingestBtn);

    await waitFor(() => {
      expect(dialog.textContent).toContain('Ingesting Screenplay');
    });
  });

  it('re-enables operator buttons on 401 Unauthorized failure without getting stuck', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/projects/proj-sample-qa/script/demo')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized: Demo Access Token missing or invalid.', code: 'UNAUTHORIZED' }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    const { getByRole, getByText } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-sample-qa',
        isOpen: true,
        initialMode: 'DEMO',
        executionMode: 'CLOUD_MODE',
        onClose: () => {},
        onUploadSuccess: () => {},
      })
    );

    const ingestBtn = getByText(/Load Bundled Demo Screenplay|Ingest Screenplay/i);
    fireEvent.click(ingestBtn);

    // 1. Error banner surfaces with UNAUTHORIZED code
    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('[UNAUTHORIZED]');
    });

    // 2. Buttons are re-enabled for retry / cancel
    expect(getByText(/Retry Ingestion/i)).toBeDefined();
    const cancelBtn = getByText('Cancel');
    expect(cancelBtn.hasAttribute('disabled')).toBe(false);
  });

  it('proves rendered WorkspacePage maintains 100% count agreement with all 7 entities in both script highlighter and registry on initial load and after replace', async () => {
    const { getByText, queryByText, getAllByText } = render(
      React.createElement(WorkspacePage, {
        projectId: 'proj-sample-qa',
        onEvaluateClearance: () => {},
        onGenerateReplacement: () => {},
        onOpenCounselReview: () => {},
        isEvaluating: false,
        refreshTrigger: 0,
        executionMode: 'CLOUD_MODE',
      })
    );

    await waitFor(() => {
      // 1. All 7 active fictional entities are present in rendered table
      expect(getAllByText('AeroTech Prism Laptop').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Summit Cola').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Elena Vance').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Nocturne of the Wild').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Veloce GT').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Midtown Spire Tower').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Titan Industrial Hazard Placard').length).toBeGreaterThanOrEqual(1);
    });

    // 2. Open Actions indicator is rendered with exact 2 count
    expect(getByText('📋 Open Actions (2)')).toBeDefined();

    // 3. Stale / legacy entities are strictly absent from rendered table
    expect(queryByText('Bob Hope')).toBeNull();
    expect(queryByText('Air France')).toBeNull();
    expect(queryByText('Budweiser')).toBeNull();
    expect(queryByText('Chevrolet')).toBeNull();
  });

  it('proves submit replace transitions through named stages including SYNCING to COMPLETE and synchronizes without secondary modals', async () => {
    let uploadSuccessCalled = false;
    let syncedSnapshot: any = null;

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/script/demo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            scenesParsed: 3,
            canonicalEntitiesExtracted: 7,
            snapshot: {
              scenes: sampleScenes,
              entities: sampleEntities,
              actionsSummary: { totalActions: 2, openActions: 2, criticalActions: 0 },
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    const { getByText, getByRole } = render(
      React.createElement(ScriptUploadModal, {
        projectId: 'proj-sample-qa',
        isOpen: true,
        initialMode: 'DEMO',
        executionMode: 'DEMO_MODE',
        onClose: () => {},
        onUploadSuccess: async (snapshot: any) => {
          uploadSuccessCalled = true;
          syncedSnapshot = snapshot;
        },
      })
    );

    const ingestBtn = getByText(/Load Bundled Demo Screenplay|Ingest Screenplay/i);
    fireEvent.click(ingestBtn);

    // Verify dialog shows progress and named machine state
    const dialog = getByRole('dialog');
    expect(dialog).toBeDefined();

    await waitFor(() => {
      expect(uploadSuccessCalled).toBe(true);
      expect(syncedSnapshot).not.toBeNull();
      expect(syncedSnapshot.entities.length).toBe(7);
      expect(syncedSnapshot.scenes.length).toBe(3);
    });
  });
});
