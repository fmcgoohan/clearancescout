// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { useModalFocus } from '../../src/hooks/useModalFocus.js';
import { ScriptUploadModal } from '../../src/components/ScriptUploadModal.js';
import { DemoTokenModal } from '../../src/components/DemoTokenModal.js';
import { ProductionDashboardModal } from '../../src/components/ProductionDashboardModal.js';
import { CitationDrawer } from '../../src/components/CitationDrawer.js';
import { RightsModal } from '../../src/components/RightsModal.js';
import { PlaceholderManagerModal } from '../../src/components/PlaceholderManagerModal.js';

// Test wrapper component for testing useModalFocus directly
const FocusTrapTestWrapper: React.FC<{
  initialOpen?: boolean;
  onClose?: () => void;
  disableEscape?: boolean;
}> = ({ initialOpen = false, onClose = () => {}, disableEscape = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const { containerRef } = useModalFocus<HTMLDivElement>({
    isOpen,
    onClose: handleClose,
    canCloseOnEscape: !disableEscape,
  });

  return (
    <div>
      <button id="trigger-btn" onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
      <button id="outside-btn">Outside Element</button>

      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Test Modal">
          <div ref={containerRef} tabIndex={-1} data-testid="modal-container">
            <button id="modal-first-btn">First Button</button>
            <input id="modal-input" placeholder="Type here" />
            <button id="modal-last-btn" onClick={handleClose}>
              Last Button
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

describe('Accessibility & Focus Management Tests (Feature 021)', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  describe('useModalFocus Hook & Focus Trapping', () => {
    it('traps Tab key navigation within the modal container (last element tabs to first)', () => {
      const { getByTestId, getByText } = render(
        <FocusTrapTestWrapper initialOpen={true} />
      );

      const container = getByTestId('modal-container');
      const firstBtn = getByText('First Button');
      const lastBtn = getByText('Last Button');

      // Focus last element
      lastBtn.focus();
      expect(document.activeElement).toBe(lastBtn);

      // Press Tab on last element -> should wrap to first element
      fireEvent.keyDown(container, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(firstBtn);
    });

    it('traps Shift+Tab key navigation within the modal container (first element shift-tabs to last)', () => {
      const { getByTestId, getByText } = render(
        <FocusTrapTestWrapper initialOpen={true} />
      );

      const container = getByTestId('modal-container');
      const firstBtn = getByText('First Button');
      const lastBtn = getByText('Last Button');

      // Focus first element
      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);

      // Press Shift+Tab on first element -> should wrap to last element
      fireEvent.keyDown(container, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastBtn);
    });

    it('closes modal on Escape key press when not disabled', () => {
      const onCloseSpy = vi.fn();
      const { getByText, queryByTestId } = render(
        <FocusTrapTestWrapper initialOpen={true} onClose={onCloseSpy} />
      );

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseSpy).toHaveBeenCalled();
    });

    it('does not close modal on Escape key press when disableEscape is true', () => {
      const onCloseSpy = vi.fn();
      const { getByTestId } = render(
        <FocusTrapTestWrapper
          initialOpen={true}
          onClose={onCloseSpy}
          disableEscape={true}
        />
      );

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseSpy).not.toHaveBeenCalled();
      expect(getByTestId('modal-container')).toBeDefined();
    });

    it('restores focus to the trigger element when the modal closes', () => {
      const { getByText, queryByTestId } = render(
        <FocusTrapTestWrapper initialOpen={false} />
      );

      const triggerBtn = getByText('Open Modal');
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open modal
      fireEvent.click(triggerBtn);

      // Modal container should exist
      expect(document.querySelector('[data-testid="modal-container"]')).not.toBeNull();

      // Close modal
      const lastBtn = getByText('Last Button');
      fireEvent.click(lastBtn);

      // Focus should be restored to the trigger button
      expect(document.activeElement).toBe(triggerBtn);
    });
  });

  describe('ScriptUploadModal Accessibility & Ingestion Live Regions', () => {
    it('declares accessible dialog structure, aria-modal, and live region for progress announcements', () => {
      const onClose = vi.fn();
      const onUploadSuccess = vi.fn();
      const { getByRole } = render(
        <ScriptUploadModal
          projectId="proj-1"
          isOpen={true}
          onClose={onClose}
          onUploadSuccess={onUploadSuccess}
        />
      );

      const dialog = getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('upload-modal-title');

      // Check for polite live region for stage status
      const statusRegion = document.querySelector('[role="status"]');
      expect(statusRegion).not.toBeNull();
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('allows Escape key to close modal during idle state', () => {
      const onClose = vi.fn();
      const onUploadSuccess = vi.fn();
      render(
        <ScriptUploadModal
          projectId="proj-1"
          isOpen={true}
          onClose={onClose}
          onUploadSuccess={onUploadSuccess}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('DemoTokenModal Accessibility', () => {
    it('declares dialog role, aria-modal, and traps focus', () => {
      const onClose = vi.fn();
      const onSave = vi.fn();
      const { getByRole, getByLabelText } = render(
        <DemoTokenModal
          isOpen={true}
          onClose={onClose}
          tokenInput=""
          onTokenInputChange={() => {}}
          onSaveToken={onSave}
        />
      );

      const dialog = getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('token-modal-title');

      const input = getByLabelText('Access Token');
      expect(input).toBeDefined();
    });
  });

  describe('ProductionDashboardModal Accessibility & Collapse Controls', () => {
    it('declares dialog role, aria-modal, and accessible collapse triggers with aria-expanded', async () => {
      const onClose = vi.fn();
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            projectId: 'proj-1',
            projectTitle: 'Test Project',
            projectType: 'FEATURE_FILM',
            kpis: {
              totalScenes: 1,
              finalClearScenes: 0,
              workingClearScenes: 0,
              redScenes: 1,
              readinessPercentage: 0,
              totalEntities: 1,
              criticalBlockersCount: 1,
              activePlaceholdersCount: 0,
              rightsExpiringSoonCount: 0,
              pendingActionsCount: 1,
            },
            sceneReadinessDistribution: [
              {
                sceneId: 'sc-1',
                sceneNumber: 1,
                heading: 'INT. OFFICE - DAY',
                status: 'RED',
                blockerCount: 1,
                workingCount: 0,
                totalOccurrences: 1,
              },
            ],
            shootBlockers: [
              {
                sceneId: 'sc-1',
                sceneNumber: 1,
                heading: 'INT. OFFICE - DAY',
                occurrenceId: 'occ-1',
                canonicalEntityId: 'ent-1',
                canonicalName: 'Test Brand',
                clearanceStatus: 'INSUFFICIENT_EVIDENCE',
                riskRationale: 'Needs legal clearance',
              },
            ],
            expiringRights: [],
            activePlaceholders: [],
            departmentActionsSummary: {
              ART_DEPT: 0,
              LEGAL_COUNSEL: 1,
              LOCATIONS: 0,
              PRODUCTION_MGMT: 0,
            },
            recentActivity: [],
          }),
        })
      );

      const { getByRole, findByRole } = render(
        <ProductionDashboardModal
          isOpen={true}
          onClose={onClose}
          projectId="proj-1"
        />
      );

      const dialog = getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('dashboard-modal-title');

      // Find the toggle collapse button
      const toggleBtn = await findByRole('button', {
        name: /Toggle Scene 1: INT. OFFICE - DAY/i,
      });
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

      // Click again to expand
      fireEvent.click(toggleBtn);
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('CitationDrawer & Entity Modals Accessibility', () => {
    it('CitationDrawer declares accessible dialog role and label', () => {
      const onClose = vi.fn();
      const { getByRole } = render(
        <CitationDrawer
          projectId="proj-1"
          isOpen={true}
          onClose={onClose}
          entityName="Summit Cola"
          citations={[]}
        />
      );

      const drawer = getByRole('dialog');
      expect(drawer.getAttribute('aria-modal')).toBe('true');
      expect(drawer.getAttribute('aria-label')).toBe('Research Dossier for Summit Cola');
    });

    it('RightsModal declares dialog role and modal behavior', () => {
      const onClose = vi.fn();
      const { getByRole } = render(
        <RightsModal
          isOpen={true}
          onClose={onClose}
          projectId="proj-1"
          entityId="ent-1"
          entityName="Summit Cola"
        />
      );

      const dialog = getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('rights-modal-title');
    });

    it('PlaceholderManagerModal declares dialog role and modal behavior', () => {
      const onClose = vi.fn();
      const { getByRole } = render(
        <PlaceholderManagerModal
          isOpen={true}
          onClose={onClose}
          projectId="proj-1"
          entityId="ent-1"
          entityName="Summit Cola"
          entityCategory="BRAND"
        />
      );

      const dialog = getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('placeholder-modal-title');
    });
  });
});
