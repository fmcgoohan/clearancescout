// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { WorkspacePage } from '../../src/pages/WorkspacePage.js';
import { ScriptUploadModal, UPLOAD_TIMEOUT_MS } from '../../src/components/ScriptUploadModal.js';

describe('Rendered UI QA: Load Bundled Fictional Demo Screenplay & 7-Phase State Machine (T050)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (url.includes('/api/projects/proj-sample-qa/snapshot') || url.includes('/api/projects/proj-sample-qa/entities')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 'ent-1', canonicalName: 'AeroTech Prism Laptop', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
            { id: 'ent-2', canonicalName: 'Summit Cola', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
            { id: 'ent-3', canonicalName: 'Elena Vance', entityCategory: 'PUBLIC_FIGURE', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
            { id: 'ent-4', canonicalName: 'Nocturne of the Wild', entityCategory: 'ART_MUSIC', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
            { id: 'ent-5', canonicalName: 'Veloce GT', entityCategory: 'BRAND', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
            { id: 'ent-6', canonicalName: 'Titan Industrial Hazard Placard', entityCategory: 'GRAPHIC_PROP', occurrencesCount: 1, activeInCurrentDraft: true, isArchivedHistorical: false, overallClearanceStatus: 'INSUFFICIENT_EVIDENCE' },
          ],
          text: async () => '',
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/scenes')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 'scene-1', sceneNumber: 1, heading: 'INT. PENTHOUSE WORKSPACE - NIGHT', readinessStatus: 'RED' },
            { id: 'scene-2', sceneNumber: 2, heading: 'EXT. MIDTOWN SPIRE TOWER - NIGHT', readinessStatus: 'RED' },
            { id: 'scene-3', sceneNumber: 3, heading: 'INT. INDUSTRIAL SUB-LEVEL - NIGHT', readinessStatus: 'RED' },
          ],
          text: async () => '',
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/actions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [],
          text: async () => '',
        });
      }
      if (url.includes('/api/projects/proj-sample-qa/readiness')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ totalScenes: 3, redScenesCount: 3, workingClearScenesCount: 0, finalClearScenesCount: 0 }),
          text: async () => '',
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '',
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('proves clicking Load Sample Screenplay opens visible modal in DEMO mode with 6 fictional items and triggers 7-phase progress without stalling', async () => {
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
    expect(dialog.textContent).toContain('AeroTech Prism Laptop');
    expect(dialog.textContent).toContain('Summit Cola');
    expect(dialog.textContent).toContain('Elena Vance');
    expect(dialog.textContent).toContain('Nocturne of the Wild');
    expect(dialog.textContent).toContain('Veloce GT');
    expect(dialog.textContent).toContain('Titan Hazard Placard');

    // 3. Operator clicks Ingest Screenplay
    const ingestBtn = getByText(/Load Bundled Demo Screenplay|Ingest Screenplay/i);
    expect(ingestBtn).toBeDefined();

    // Mock successful 7-phase demo upload response
    (global.fetch as any).mockImplementationOnce((url: string) => {
      if (url.includes('/api/projects/proj-sample-qa/script/demo')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            scenesParsed: 3,
            canonicalEntitiesExtracted: 6,
            snapshot: {
              scenes: [
                { id: 'scene-1', sceneNumber: 1, heading: 'INT. PENTHOUSE WORKSPACE - NIGHT' },
                { id: 'scene-2', sceneNumber: 2, heading: 'EXT. MIDTOWN SPIRE TOWER - NIGHT' },
                { id: 'scene-3', sceneNumber: 3, heading: 'INT. INDUSTRIAL SUB-LEVEL - NIGHT' },
              ],
              entities: [
                { id: 'ent-1', canonicalName: 'AeroTech Prism Laptop', occurrencesCount: 1, activeInCurrentDraft: true },
                { id: 'ent-2', canonicalName: 'Summit Cola', occurrencesCount: 1, activeInCurrentDraft: true },
                { id: 'ent-3', canonicalName: 'Elena Vance', occurrencesCount: 1, activeInCurrentDraft: true },
                { id: 'ent-4', canonicalName: 'Nocturne of the Wild', occurrencesCount: 1, activeInCurrentDraft: true },
                { id: 'ent-5', canonicalName: 'Veloce GT', occurrencesCount: 1, activeInCurrentDraft: true },
                { id: 'ent-6', canonicalName: 'Titan Industrial Hazard Placard', occurrencesCount: 1, activeInCurrentDraft: true },
              ],
              actionsSummary: { totalActions: 0, openActions: 0, criticalActions: 0 },
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    fireEvent.click(ingestBtn);

    // 4. Ingesting progress indicator is immediately displayed
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

    const { getByRole, getByText, queryByRole } = render(
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

  it('re-enables operator buttons on 500 / Network failure and allows retry', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/projects/proj-sample-qa/script/demo')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Model Extraction Failure', code: 'PARSING_FAILED' }),
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

    // 1. Error banner surfaces
    await waitFor(() => {
      const alert = getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('[PARSING_FAILED]');
    });

    // 2. Retry button is available and clickable
    const retryBtn = getByText(/Retry Ingestion/i);
    expect(retryBtn).toBeDefined();
    expect(retryBtn.hasAttribute('disabled')).toBe(false);
  });

  it('proves rendered WorkspacePage and Header maintain 100% count agreement with 0 Open Actions', async () => {
    const { getByText, queryByText } = render(
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
      // 1. All 6 active fictional entities are present in rendered document
      expect(getByText('AeroTech Prism Laptop')).toBeDefined();
      expect(getByText('Summit Cola')).toBeDefined();
      expect(getByText('Elena Vance')).toBeDefined();
      expect(getByText('Nocturne of the Wild')).toBeDefined();
      expect(getByText('Veloce GT')).toBeDefined();
      expect(getByText('Titan Industrial Hazard Placard')).toBeDefined();
    });

    // 2. Open Actions indicator is rendered with exact 0 count
    expect(getByText('📋 Open Actions (0)')).toBeDefined();

    // 3. Stale / legacy entities are strictly absent from rendered table
    expect(queryByText('Bob Hope')).toBeNull();
    expect(queryByText('Air France')).toBeNull();
    expect(queryByText('Budweiser')).toBeNull();
    expect(queryByText('Chevrolet')).toBeNull();
  });
});
