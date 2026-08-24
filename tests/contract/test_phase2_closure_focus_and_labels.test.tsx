// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecommendedActionCard } from '../../src/components/RecommendedActionCard';
import { CitationDrawer } from '../../src/components/CitationDrawer';
import { OnboardingBanner } from '../../src/components/OnboardingBanner';
import { CanonicalEntity } from '../../src/components/EntityRegistryTable';

const mockEntities: CanonicalEntity[] = [
  {
    id: 'ent-ee6ff3e4',
    canonicalName: 'Nocturne of the Wild',
    entityCategory: 'ARTWORK',
    description: 'Painting in scene 1',
    overallClearanceStatus: 'ACTION_REQUIRED',
    occurrences: [{ occurrenceId: 'occ-1', sceneNumber: 1, sceneHeading: 'INT. GALLERY', snippet: 'Nocturne painting', riskLevel: 'BLOCKS_SHOOTING' }],
    departmentTasks: ['task-1'],
    evidenceCount: 0,
  },
  {
    id: 'ent-2',
    canonicalName: 'Slurm Soda',
    entityCategory: 'COMMERCIAL_BRAND',
    description: 'Soda can',
    overallClearanceStatus: 'ACTION_REQUIRED',
    occurrences: [{ occurrenceId: 'occ-2', sceneNumber: 2, sceneHeading: 'EXT. STREET', snippet: 'Slurm can', riskLevel: 'BLOCKS_SHOOTING' }],
    departmentTasks: [],
    evidenceCount: 0,
  },
];

describe('Phase 2 Closure Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('FIX 2: recommended-action title, button label, aria-label, and drawer heading agree on single-entity target', () => {
    const handleResearch = vi.fn();
    render(
      <RecommendedActionCard
        entities={mockEntities}
        onResearchItem={handleResearch}
      />
    );

    const matches = screen.getAllByText('Research Nocturne of the Wild');
    expect(matches.length).toBeGreaterThanOrEqual(2);

    const button = screen.getByRole('button', { name: 'Research Nocturne of the Wild' });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-label')).toBe('Research Nocturne of the Wild');

    fireEvent.click(button);
    expect(handleResearch).toHaveBeenCalledWith('ent-ee6ff3e4');
  });

  it('FIX 1: origin-aware focus restoration returns focus to recommended action button after Escape dismissal', async () => {
    const TestHarness = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <div>
          <button id="project-switcher" type="button">Switch Project</button>
          <button
            id="rec-action-btn"
            type="button"
            aria-label="Research Nocturne of the Wild"
            onClick={() => setIsOpen(true)}
          >
            Research Nocturne of the Wild
          </button>

          <CitationDrawer
            projectId="proj-123"
            canonicalEntityId="ent-ee6ff3e4"
            entityName="Nocturne of the Wild"
            citations={[]}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      );
    };

    render(<TestHarness />);

    const triggerBtn = screen.getByRole('button', { name: 'Research Nocturne of the Wild' });
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    // Verify focus is trapped inside the drawer
    const closeBtn = screen.getByRole('button', { name: /Close research evidence drawer/i });
    expect(document.activeElement).toBe(closeBtn);

    // Dismiss with Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Verify focus restored to triggerBtn (NOT project-switcher!)
    expect(document.activeElement).toBe(triggerBtn);
  });

  it('FIX 1: focus restores to originating trigger when closed via Close button (X)', async () => {
    const TestHarness = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <div>
          <button
            id="rec-action-btn"
            type="button"
            aria-label="Research Nocturne of the Wild"
            onClick={() => setIsOpen(true)}
          >
            Research Nocturne of the Wild
          </button>

          <CitationDrawer
            projectId="proj-123"
            canonicalEntityId="ent-ee6ff3e4"
            entityName="Nocturne of the Wild"
            citations={[]}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      );
    };

    render(<TestHarness />);

    const triggerBtn = screen.getByRole('button', { name: 'Research Nocturne of the Wild' });
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    const closeBtn = screen.getByRole('button', { name: /Close research evidence drawer/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(document.activeElement).toBe(triggerBtn);
  });

  it('FIX 1 (CROSS-PANEL): restores focus to Clearance Items target when Overview trigger unmounts', async () => {
    const CrossPanelHarness = () => {
      const [activeTab, setActiveTab] = React.useState<'overview' | 'clearance'>('overview');
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <div>
          <button id="project-switcher" type="button">Switch Project</button>
          <div role="tablist">
            <button
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              id="tab-clearance"
              role="tab"
              aria-selected={activeTab === 'clearance'}
              onClick={() => setActiveTab('clearance')}
            >
              Clearance Items
            </button>
          </div>

          {activeTab === 'overview' && (
            <button
              id="overview-rec-btn"
              type="button"
              aria-label="Research Nocturne of the Wild"
              onClick={() => {
                setActiveTab('clearance');
                setIsOpen(true);
              }}
            >
              Research Nocturne of the Wild
            </button>
          )}

          {activeTab === 'clearance' && (
            <div id="clearance-table">
              <button
                data-entity-id="ent-ee6ff3e4"
                aria-label="Research Nocturne of the Wild"
                onClick={() => setIsOpen(true)}
              >
                Research
              </button>
            </div>
          )}

          <CitationDrawer
            projectId="proj-123"
            canonicalEntityId="ent-ee6ff3e4"
            entityName="Nocturne of the Wild"
            citations={[]}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>
      );
    };

    render(<CrossPanelHarness />);

    const overviewBtn = screen.getByRole('button', { name: 'Research Nocturne of the Wild' });
    overviewBtn.focus();
    fireEvent.click(overviewBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    // Dismiss drawer via Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Assert focus restored to mounted Research button in Clearance Items (or tab-clearance), NOT project-switcher!
    const targetInClearance = screen.getByRole('button', { name: 'Research Nocturne of the Wild' });
    expect(document.activeElement).toBe(targetInClearance);
    expect(document.activeElement?.id).not.toBe('project-switcher');
  });

  describe('Project-Scoped Onboarding Persistence', () => {
    it('persists dismissal per project and isolates project A from project B', () => {
      const { unmount } = render(<OnboardingBanner projectId="project-A" />);

      expect(screen.getByText(/Automated Screenplay Clearance/i)).toBeDefined();

      const dismissBtn = screen.getByRole('button', { name: 'Dismiss clearance guide' });
      fireEvent.click(dismissBtn);

      expect(screen.queryByText(/Automated Screenplay Clearance/i)).toBeNull();
      expect(localStorage.getItem('clearancescout:onboarding:v1:project-A')).toBe('true');

      unmount();

      // Project B should still show onboarding banner
      const { unmount: unmountB } = render(<OnboardingBanner projectId="project-B" />);
      expect(screen.getByText(/Automated Screenplay Clearance/i)).toBeDefined();
      unmountB();

      // Returning to Project A should remain dismissed
      render(<OnboardingBanner projectId="project-A" />);
      expect(screen.queryByText(/Automated Screenplay Clearance/i)).toBeNull();
    });

    it('recomputes dismissal state dynamically when projectId prop changes', () => {
      const { rerender } = render(<OnboardingBanner projectId="project-A" />);

      const dismissBtn = screen.getByRole('button', { name: 'Dismiss clearance guide' });
      fireEvent.click(dismissBtn);
      expect(screen.queryByText(/Automated Screenplay Clearance/i)).toBeNull();

      // Switch prop to project-B
      rerender(<OnboardingBanner projectId="project-B" />);
      expect(screen.getByText(/Automated Screenplay Clearance/i)).toBeDefined();

      // Switch prop back to project-A
      rerender(<OnboardingBanner projectId="project-A" />);
      expect(screen.queryByText(/Automated Screenplay Clearance/i)).toBeNull();
    });

    it('retires legacy flat key and handles storage failure gracefully', () => {
      localStorage.setItem('clearancescout_onboarding_dismissed', 'true');

      // Legacy flat key should not dismiss onboarding for project-X
      render(<OnboardingBanner projectId="project-X" />);
      expect(screen.getByText(/Automated Screenplay Clearance/i)).toBeDefined();

      // Dismissing project-X retires legacy flat key
      const dismissBtn = screen.getByRole('button', { name: 'Dismiss clearance guide' });
      fireEvent.click(dismissBtn);

      expect(localStorage.getItem('clearancescout_onboarding_dismissed')).toBeNull();
      expect(localStorage.getItem('clearancescout:onboarding:v1:project-X')).toBe('true');
    });
  });
});
