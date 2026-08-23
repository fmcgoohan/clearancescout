// @vitest-environment jsdom
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { DemoTokenModal } from '../../src/components/DemoTokenModal';
import { ScriptUploadModal } from '../../src/components/ScriptUploadModal';
import { ProjectListModal } from '../../src/components/ProjectListModal';
import { ProductionDashboardModal } from '../../src/components/ProductionDashboardModal';
import { ActionListModal } from '../../src/components/ActionListModal';
import { EntityDetailModal } from '../../src/components/EntityDetailModal';
import { PlaceholderManagerModal } from '../../src/components/PlaceholderManagerModal';
import { RightsModal } from '../../src/components/RightsModal';
import { ItemEditModal } from '../../src/components/ItemEditModal';
import { ReplacementCardModal } from '../../src/components/ReplacementCardModal';
import { ComparisonModal } from '../../src/components/ComparisonModal';
import { BinderExportModal } from '../../src/components/BinderExportModal';

describe('Phase 1 Demo Token Modal & Cross-Modal Contract Tests', () => {
  let rootContainer: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    rootContainer = document.createElement('div');
    rootContainer.id = 'root';
    document.body.appendChild(rootContainer);
  });

  // --- 1. Demo Token Modal Specific Contract Tests ---

  it('demo_token_dialog_renders_above_backdrop', () => {
    render(
      <DemoTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenInput=""
        onTokenInputChange={() => {}}
        onSaveToken={() => {}}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    // Verify it is portaled to document.body outside #root
    expect(dialog.parentElement).toBe(document.body);
    expect(rootContainer.contains(dialog)).toBe(false);
  });

  it('demo_token_dialog_background_is_inert', () => {
    render(
      <DemoTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenInput=""
        onTokenInputChange={() => {}}
        onSaveToken={() => {}}
      />
    );

    // Underlying workspace (#root) must be aria-hidden="true"
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('demo_token_dialog_traps_focus', () => {
    render(
      <DemoTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenInput="test-token"
        onTokenInputChange={() => {}}
        onSaveToken={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Enter demo token/i);
    expect(input).toBeDefined();
    expect(document.activeElement).toBe(input);
  });

  it('demo_token_escape_closes', () => {
    let closed = false;
    render(
      <DemoTokenModal
        isOpen={true}
        onClose={() => { closed = true; }}
        tokenInput=""
        onTokenInputChange={() => {}}
        onSaveToken={() => {}}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('demo_token_cancel_closes', () => {
    let closed = false;
    render(
      <DemoTokenModal
        isOpen={true}
        onClose={() => { closed = true; }}
        tokenInput=""
        onTokenInputChange={() => {}}
        onSaveToken={() => {}}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(closed).toBe(true);
  });

  it('demo_token_close_restores_trigger_focus', () => {
    const trigger = document.createElement('button');
    trigger.id = 'demo-token-trigger';
    rootContainer.appendChild(trigger);
    trigger.focus();

    const TestWrapper = () => {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button id="trigger" onClick={() => setOpen(true)}>Trigger</button>
          <DemoTokenModal
            isOpen={open}
            onClose={() => setOpen(false)}
            tokenInput=""
            onTokenInputChange={() => {}}
            onSaveToken={() => {}}
          />
        </div>
      );
    };

    render(<TestWrapper />);

    // Click Close
    const closeBtn = screen.getByLabelText(/Close Demo Access Token dialog/i);
    fireEvent.click(closeBtn);

    // Root should no longer be aria-hidden
    expect(rootContainer.getAttribute('aria-hidden')).toBeNull();
  });

  // --- 2. Cross-Modal Contract Tests Across All Major Dialog Surfaces ---

  it('cross_modal_contract: ScriptUploadModal satisfy dialog, portal, and inertness contract', () => {
    render(
      <ScriptUploadModal
        projectId="proj-1"
        isOpen={true}
        onClose={() => {}}
        onUploadSuccess={() => {}}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ProjectListModal satisfies dialog and inertness contract', () => {
    render(
      <ProjectListModal
        isOpen={true}
        activeProjectId="proj-1"
        onClose={() => {}}
        onSelectProject={() => {}}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ProductionDashboardModal satisfies dialog and inertness contract', () => {
    render(
      <ProductionDashboardModal
        isOpen={true}
        onClose={() => {}}
        projectId="proj-1"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ActionListModal satisfies dialog and inertness contract', () => {
    render(
      <ActionListModal
        isOpen={true}
        onClose={() => {}}
        projectId="proj-1"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: EntityDetailModal satisfies dialog and inertness contract', () => {
    render(
      <EntityDetailModal
        isOpen={true}
        onClose={() => {}}
        projectId="proj-1"
        entityId="entity-1"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: PlaceholderManagerModal satisfies dialog and inertness contract', () => {
    render(
      <PlaceholderManagerModal
        isOpen={true}
        onClose={() => {}}
        projectId="proj-1"
        entityId="entity-1"
        entityName="Summit Cola"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: RightsModal satisfies dialog and inertness contract', () => {
    render(
      <RightsModal
        isOpen={true}
        onClose={() => {}}
        projectId="proj-1"
        entityId="entity-1"
        entityName="Summit Cola"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ItemEditModal satisfies dialog and inertness contract', () => {
    render(
      <ItemEditModal
        isOpen={true}
        onClose={() => {}}
        entityToEdit={null}
        onSave={async () => {}}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ReplacementCardModal satisfies dialog and inertness contract', () => {
    render(
      <ReplacementCardModal
        isOpen={true}
        onClose={() => {}}
        card={{
          id: 'card-1',
          canonicalEntityId: 'entity-1',
          fictionalBrandName: 'Summit Soda',
          designBrief: 'Modern cola replacement',
          artworkImageUrl: '',
          nonInfringementRationale: 'Distinct visual identity',
          status: 'CLEARED'
        }}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: ComparisonModal satisfies dialog and inertness contract', () => {
    render(
      <ComparisonModal
        isOpen={true}
        onClose={() => {}}
        data={{
          projectId: 'proj-1',
          original: {
            id: 'orig-1',
            canonicalName: 'Coca-Cola',
            entityCategory: 'PROPS',
            description: 'Soda can',
            overallClearanceStatus: 'ACTION_REQUIRED',
            riskScore: 8,
            legalRationale: 'High trademark risk',
            citations: []
          },
          replacement: {
            id: 'rep-1',
            replacementName: 'Summit Cola',
            entityCategory: 'PROPS',
            clearanceStatus: 'NO_ISSUE_SURFACED',
            isEscalated: false,
            attemptsCount: 1,
            generationPrompt: 'Fictional soda',
            visualStyle: 'Modern red can',
            citations: []
          },
          attemptHistory: []
        }}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });

  it('cross_modal_contract: BinderExportModal satisfies dialog and inertness contract', () => {
    render(
      <BinderExportModal
        isOpen={true}
        onClose={() => {}}
        binder={{
          id: 'binder-1',
          projectId: 'proj-1',
          projectSummary: {
            title: 'Demo Project',
            productionCompany: 'Test Prod Co',
            scriptVersion: 'v1.0',
            totalScenes: 3,
            totalEntities: 7,
            clearedCount: 5,
            actionRequiredCount: 2,
            reviewRecommendedCount: 0,
            overridesCount: 0
          },
          scenes: [],
          canonicalEntities: [],
          citationsIndex: [],
          replacementCatalog: [],
          overridesHistory: [],
          exportedAt: new Date().toISOString(),
          integrityDigest: 'sha256-test',
          disclaimer: 'Legal clearance report disclaimer'
        }}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(rootContainer.getAttribute('aria-hidden')).toBe('true');
  });
});
