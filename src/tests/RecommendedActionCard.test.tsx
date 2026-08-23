// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RecommendedActionCard } from '../components/RecommendedActionCard';
import { CanonicalEntity } from '../components/EntityRegistryTable';

const mockEntities: CanonicalEntity[] = [
  {
    id: 'ent-1',
    canonicalName: 'Nocturne of the Wild',
    entityCategory: 'ARTWORK',
    description: 'Track in scene 1',
    overallClearanceStatus: 'ACTION_REQUIRED',
    occurrences: [{ occurrenceId: 'occ-1', sceneNumber: 1, sceneHeading: 'INT. LAB', snippet: 'Nocturne poster', riskLevel: 'BLOCKS_SHOOTING' }],
    departmentTasks: ['task-1'],
    evidenceCount: 0,
  },
  {
    id: 'ent-2',
    canonicalName: 'Slurm Soda',
    entityCategory: 'COMMERCIAL_BRAND',
    description: 'Can in scene 2',
    overallClearanceStatus: 'NO_ISSUE_SURFACED',
    occurrences: [{ occurrenceId: 'occ-2', sceneNumber: 2, sceneHeading: 'EXT. ALLEY', snippet: 'Slurm can', riskLevel: 'NO_ISSUE_SURFACED' }],
    departmentTasks: [],
    evidenceCount: 1,
  },
];

describe('RecommendedActionCard Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders recommended action card with most urgent unresolved blocker', () => {
    const handleResearch = vi.fn();
    render(
      <RecommendedActionCard
        entities={mockEntities}
        onResearchItem={handleResearch}
      />
    );

    expect(screen.getByRole('region', { name: /Recommended Action/i })).toBeDefined();
    expect(screen.getByText(/1 clearance item require action/i)).toBeDefined();
    expect(screen.getByText(/Start with Nocturne of the Wild/i)).toBeDefined();

    const button = screen.getByRole('button', { name: /Research Nocturne of the Wild/i });
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(handleResearch).toHaveBeenCalledWith('ent-1');
  });

  it('renders completion state when zero unresolved blockers exist', () => {
    const clearedEntities = mockEntities.map((e) => ({ ...e, overallClearanceStatus: 'NO_ISSUE_SURFACED' as const }));
    render(<RecommendedActionCard entities={clearedEntities} />);

    expect(screen.getByText(/All Clearance Items Cleared/i)).toBeDefined();
  });
});
